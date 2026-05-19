// Clear the cancel function when done
	a.streamCancel = nil

	// Add assistant message to history
	a.chatMessages = append(a.chatMessages, map[string]interface{}{
		"role":      "assistant",
		"content":   response.String(),
		"timestamp": time.Now().Unix(),
	})

	// Emit complete event with structured payload for TTS autoplay
	runtime.EventsEmit(a.ctx, "chat:complete", map[string]interface{}{
		"message": response.String(),
	})
	return nil
}

// GenerateCharacterResponse generates a response for a specific character
// Emits character-specific events: chat:chunk:characterId, chat:complete:characterId, chat:error:characterId
func (a *App) GenerateCharacterResponse(message string, characterID string) error {
	if a.httpClient == nil {
		return fmt.Errorf("llama client not initialized")
	}

	// Find character by ID
	var character *chat.CharacterContext
	for _, c := range a.characters {
		if c.ID == characterID {
			character = c
			break
		}
	}

	if character == nil {
		return fmt.Errorf("character not found: %s", characterID)
	}

	// Build character-specific system prompt from all available character fields
	charName := character.Name

	prompt := fmt.Sprintf("You are %s, a distinct participant in a group roleplay conversation.\n", charName)
	prompt += "You speak only when someone addresses you directly by name, role, or context, or when it is naturally your turn to respond.\n"
	prompt += "If others are speaking to each other, you listen quietly and stay in character, reacting only when your involvement makes sense.\n\n"
	if character.Age != "" {
		prompt += fmt.Sprintf("Age: %s.\n", character.Age)
	}
	if character.Role != "" {
		prompt += fmt.Sprintf("Role/Relationship: %s.\n", character.Role)
	}
	if character.Description != "" {
		prompt += fmt.Sprintf("Appearance: %s\n", character.Description)
	}
	if character.Personality != "" {
		prompt += fmt.Sprintf("Personality: %s\n", character.Personality)
	}
	if character.Backstory != "" {
		prompt += fmt.Sprintf("Backstory: %s\n", character.Backstory)
	}
	if character.Background != "" {
		prompt += fmt.Sprintf("Background: %s\n", character.Background)
	}

	// Inject character-scoped lorebooks and memories
	loreBlock := a.resolveCharacterLorePromptBlock(character.Name)
	if loreBlock != "" {
		prompt += fmt.Sprintf("\n%s\n", loreBlock)
	}

	prompt += fmt.Sprintf("\nRespond to: %s", message)

	// Convert sampler settings to InferenceOptions
	opts := llama.NewInferenceOptions()
	if s := a.samplerSettings; s != nil {
		if v, ok := s["temperature"].(float64); ok {
			opts.Temperature = v
		}
		if v, ok := s["top_p"].(float64); ok {
			opts.TopP = v
		}
		if v, ok := s["top_k"].(float64); ok {
			opts.TopK = int(v)
		}
		if v, ok := s["repeat_penalty"].(float64); ok {
			opts.RepeatPenalty = v
		}
		if v, ok := s["seed"].(float64); ok {
			opts.Seed = int(v)
		}
	}

	// Set stop sequences
	stopSequences := []string{"<|im_end|>", "\nUser:", "System:", "\n<|think>"}
	if ms := a.modelSettings; ms != nil {
		if customStops, ok := ms["stop_sequences"].([]string); ok && len(customStops) > 0 {
			stopSequences = customStops
		}
	}
	opts.StopStrings = stopSequences

	// Create cancellable context and register it so AbortStream() can cancel this stream
	streamCtx, cancel := context.WithCancel(context.Background())
	a.streamCancel = cancel

	eventPrefix := fmt.Sprintf("chat:chunk:%s", characterID)
	completeEvent := fmt.Sprintf("chat:complete:%s", characterID)
	errorEvent := fmt.Sprintf("chat:error:%s", characterID)
	abortedEvent := fmt.Sprintf("chat:aborted:%s", characterID)

	var response strings.Builder

	// Stream the response
	err := a.httpClient.GenerateStream(prompt, opts, func(chunk string, done bool) {
		select {
		case <-streamCtx.Done():
			return
		default:
			if done {
				return
			}
			response.WriteString(chunk)
			runtime.EventsEmit(a.ctx, eventPrefix, chunk)
		}
	})

	if err != nil {
		// Distinguish a user-initiated abort from a real error
		select {
		case <-streamCtx.Done():
			runtime.EventsEmit(a.ctx, abortedEvent)
			a.streamCancel = nil
			return nil
		default:
			runtime.EventsEmit(a.ctx, errorEvent, err.Error())
			a.streamCancel = nil
			return err
		}
	}

	a.streamCancel = nil

	// Record completed response via AppendChatMessage (also writes to history.ndjson)
	_ = a.AppendChatMessage("assistant", response.String(), charName)

	// Emit generic chat:complete with characterId for TTS autoplay routing
	runtime.EventsEmit(a.ctx, "chat:complete", map[string]interface{}{
		"message":     response.String(),
		"characterId": characterID,
	})
	// Emit per-character completion event for frontend stream cleanup
	runtime.EventsEmit(a.ctx, completeEvent, response.String())
	return nil
}

// AppendChatMessage records a message in the in-memory history and immediately
// appends it to history.ndjson — O(1) disk write, no full file rewrite.
// Called by the frontend for user turns and by GenerateCharacterResponse for
// assistant turns. Both paths must call this so history.ndjson stays complete.
func (a *App) AppendChatMessage(role, content, sender string) error {
	if strings.TrimSpace(content) == "" {
		return nil
	}
	a.chatMessages = append(a.chatMessages, map[string]interface{}{
		"role":      role,
		"content":   content,
		"sender":    sender,
		"timestamp": time.Now().Unix(),
	})

	chatID := ""
	if a.chatPersistence != nil {
		chatID = a.chatPersistence.GetLastChatID()
	}
	if chatID == "" {
		return nil // no active chat yet — in-memory only is fine
	}

	entry := chat.ChatHistory{
		ID:        fmt.Sprintf("%d", len(a.chatMessages)-1),
		Sender:    sender,
		Text:      content,
		Role:      role,
		Timestamp: time.Now().Format(time.RFC3339),
	}
	return a.chatPersistence.AppendHistoryEntry(chatID, entry)
}

// buildPrompt builds a prompt from the chat history using System-Heavy Structured Prompt architecture
func (a *App) buildPrompt() string {
	var prompt strings.Builder

	// Apply user_prefix and assistant_prefix overrides if configured
	userPrefix := ""
	assistantPrefix := ""
	if a.modelSettings != nil {
		if up, ok := a.modelSettings["user_prefix"].(string); ok && up != "" {
			userPrefix = up
		}
		if ap, ok := a.modelSettings["assistant_prefix"].(string); ok && ap != "" {
			assistantPrefix = ap
		}
	}

	// 1. OPEN SYSTEM BLOCK with ChatML tags
	prompt.WriteString("<|im_start|>system\n")

	// Apply system prompt override if configured
	if a.modelSettings != nil {
		if spo, ok := a.modelSettings["system_prompt_override"].(string); ok && spo != "" {
			prompt.WriteString(spo + "\n\n")
		} else {
			prompt.WriteString("You are in an immersive roleplay. Stay in character at all times.\n\n")
		}
	} else {
		prompt.WriteString("You are in an immersive roleplay. Stay in character at all times.\n\n")
	}

	// 2. CONSOLIDATED CONTEXT (World, Scenario, Characters) - Single System Block
	if a.world != nil {
		worldName := a.world.Name
		if worldName != "" {
			prompt.WriteString(fmt.Sprintf("[WORLD: %s]\n", worldName))
		}
		if desc := a.world.Description; desc != "" {
			prompt.WriteString(fmt.Sprintf("Description: %s\n", desc))
		}
		if len(a.world.KeyFacts) > 0 {
			prompt.WriteString(fmt.Sprintf("Key Facts: %s\n", strings.Join(a.world.KeyFacts, ", ")))
		}
		prompt.WriteString("\n")
	}

	if a.scenario != nil {
		scenarioName := a.scenario.Name
		if scenarioName != "" {
			prompt.WriteString(fmt.Sprintf("[SCENARIO: %s]\n", scenarioName))
		}
		if desc := a.scenario.Description; desc != "" {
			prompt.WriteString(fmt.Sprintf("Description: %s\n", desc))
		}
		if len(a.scenario.KeyDetails) > 0 {
			prompt.WriteString(fmt.Sprintf("Key Details: %s\n", strings.Join(a.scenario.KeyDetails, ", ")))
		}
		prompt.WriteString("\n")
	}

	if len(a.characters) > 0 {
		prompt.WriteString("[CHARACTER SHEETS]\n")
		for _, char := range a.characters {
			charName := char.Name
			if charName != "" {
				prompt.WriteString(fmt.Sprintf("Character: %s\n", charName))
			}
			if char.Personality != "" {
				prompt.WriteString(fmt.Sprintf("Personality: %s\n", char.Personality))
			}
			if char.Backstory != "" {
				prompt.WriteString(fmt.Sprintf("Backstory: %s\n", char.Backstory))
			}
			if len(char.Goals) > 0 {
				prompt.WriteString(fmt.Sprintf("Goals: %s\n", strings.Join(char.Goals, ", ")))
			}
			if len(char.Relationships) > 0 {
				prompt.WriteString(fmt.Sprintf("Relationships: %s\n", strings.Join(char.Relationships, ", ")))
			}
			prompt.WriteString("\n")
		}
		prompt.WriteString("When replying, use the character information above to keep each response aligned to the character sheet and the scenario context.\n\n")
	}

	if loreBlock := a.resolveLorePromptBlock(); loreBlock != "" {
		prompt.WriteString(loreBlock + "\n")
	}

	// 3. THE "STABILITY" GUARDRAIL
	prompt.WriteString("[RULE: Do not show internal thinking. Do not use 'Here is my thought process'. Start your response immediately as the character.]\n")
	prompt.WriteString("<|im_end|>\n")

	// 4. CHAT HISTORY with ChatML tags
	for _, msg := range a.chatMessages {
		role := msg["role"].(string)
		content := msg["content"].(string)
		if role == "user" {
			prompt.WriteString(fmt.Sprintf("%s%s<|im_end|>\n", userPrefix, content))
		} else if role == "assistant" {
			prompt.WriteString(fmt.Sprintf("%s%s<|im_end|>\n", assistantPrefix, content))
		}
	}

	// 5. CLOSING TAG
	prompt.WriteString("<|im_start|>assistant\n")
	return prompt.String()
}

// resolveLorePromptBlock consolidates all active lorebook entries into a single
// formatted block for the system prompt. Deduplicates by entry ID to prevent
// repeated lore from multiple characters triggering the same entry.
func (a *App) resolveLorePromptBlock() string {
	if len(a.lorebooks) == 0 {
		return ""
	}

	seen := make(map[string]bool)
	var blocks []string

	for _, entry := range a.lorebooks {
		if seen[entry.ID] {
			continue
		}
		seen[entry.ID] = true

		if entry.Triggered {
			if entry.Content != "" {
				blocks = append(blocks, fmt.Sprintf("[LORE: %s]\n%s", entry.Key, entry.Content))
			}
		}
	}

	if len(blocks) == 0 {
		return ""
	}

	return strings.Join(blocks, "\n\n")
}

// resolveCharacterLorePromptBlock returns lorebook entries specific to a character
func (a *App) resolveCharacterLorePromptBlock(characterName string) string {
	if len(a.lorebooks) == 0 {
		return ""
	}

	var blocks []string

	for _, entry := range a.lorebooks {
		if entry.Triggered && strings.Contains(entry.Character, characterName) {
			if entry.Content != "" {
				blocks = append(blocks, fmt.Sprintf("[CHARACTER LORE: %s]\n%s", entry.Key, entry.Content))
			}
		}
	}

	if len(blocks) == 0 {
		return ""
	}

	return strings.Join(blocks, "\n\n")
}

// AbortStream cancels the active LLM generation stream
func (a *App) AbortStream() error {
	if a.streamCancel == nil {
		return fmt.Errorf("no active stream to abort")
	}
	a.streamCancel()
	a.streamCancel = nil
	runtime.EventsEmit(a.ctx, "chat:aborted")
	return nil
}

// GetChatMessages returns the in-memory chat history
func (a *App) GetChatMessages() []map[string]interface{} {
	return a.chatMessages
}

// ClearChatMessages clears the in-memory chat history
func (a *App) ClearChatMessages() {
	a.chatMessages = []map[string]interface{}{}
}

// LoadScenario loads a scenario from a JSON file
func (a *App) LoadScenario(scenarioPath string) error {
	data, err := os.ReadFile(scenarioPath)
	if err != nil {
		return fmt.Errorf("read scenario: %w", err)
	}

	var scenario chat.ScenarioContext
	if err := json.Unmarshal(data, &scenario); err != nil {
		return fmt.Errorf("parse scenario: %w", err)
	}

	a.scenario = &scenario
	runtime.EventsEmit(a.ctx, "scenario:loaded", scenario.Name)
	return nil
}

// LoadWorld loads a world from a JSON file
func (a *App) LoadWorld(worldPath string) error {
	data, err := os.ReadFile(worldPath)
	if err != nil {
		return fmt.Errorf("read world: %w", err)
	}

	var world chat.WorldContext
	if err := json.Unmarshal(data, &world); err != nil {
		return fmt.Errorf("parse world: %w", err)
	}

	a.world = &world
	runtime.EventsEmit(a.ctx, "world:loaded", world.Name)
	return nil
}

// LoadCharacter loads a character from a JSON file
func (a *App) LoadCharacter(characterPath string) error {
	data, err := os.ReadFile(characterPath)
	if err != nil {
		return fmt.Errorf("read character: %w", err)
	}

	var character chat.CharacterContext
	if err := json.Unmarshal(data, &character); err != nil {
		return fmt.Errorf("parse character: %w", err)
	}

	a.characters = append(a.characters, &character)
	runtime.EventsEmit(a.ctx, "character:loaded", character.Name)
	return nil
}

// LoadLorebook loads a lorebook from a JSON file
func (a *App) LoadLorebook(lorebookPath string) error {
	data, err := os.ReadFile(lorebookPath)
	if err != nil {
		return fmt.Errorf("read lorebook: %w", err)
	}

	var lorebook lorebook.Lorebook
	if err := json.Unmarshal(data, &lorebook); err != nil {
		return fmt.Errorf("parse lorebook: %w", err)
	}

	for _, entry := range lorebook.Entries {
		a.lorebooks = append(a.lorebooks, entry)
	}

	runtime.EventsEmit(a.ctx, "lorebook:loaded", lorebook.Name)
	return nil
}

// TriggerLorebookEntry triggers a lorebook entry by key
func (a *App) TriggerLorebookEntry(key string) error {
	for _, entry := range a.lorebooks {
		if entry.Key == key {
			entry.Triggered = true
			a.triggeredLore[key] = true
			runtime.EventsEmit(a.ctx, "lore:triggered", key)
			return nil
		}
	}
	return fmt.Errorf("lorebook entry not found: %s", key)
}

// GetTriggeredLore returns all triggered lorebook entries
func (a *App) GetTriggeredLore() []lorebook.Entry {
	var triggered []lorebook.Entry
	for _, entry := range a.lorebooks {
		if entry.Triggered {
			triggered = append(triggered, entry)
		}
	}
	return triggered
}

// ClearTriggeredLore clears all triggered lorebook entries
func (a *App) ClearTriggeredLore() {
	for _, entry := range a.lorebooks {
		entry.Triggered = false
	}
	a.triggeredLore = make(map[string]bool)
	runtime.EventsEmit(a.ctx, "lore:cleared")
}

// GetScenario returns the loaded scenario
func (a *App) GetScenario() *chat.ScenarioContext {
	return a.scenario
}

// GetWorld returns the loaded world
func (a *App) GetWorld() *chat.WorldContext {
	return a.world
}

// GetCharacters returns the loaded characters
func (a *App) GetCharacters() []*chat.CharacterContext {
	return a.characters
}

// GetLorebooks returns the loaded lorebook entries
func (a *App) GetLorebooks() []lorebook.Entry {
	return a.lorebooks
}

// SetScenario sets the scenario directly
func (a *App) SetScenario(scenario chat.ScenarioContext) {
	a.scenario = &scenario
	runtime.EventsEmit(a.ctx, "scenario:loaded", scenario.Name)
}

// SetWorld sets the world directly
func (a *App) SetWorld(world chat.WorldContext) {
	a.world = &world
	runtime.EventsEmit(a.ctx, "world:loaded", world.Name)
}

// SetCharacters sets the characters directly
func (a *App) SetCharacters(characters []*chat.CharacterContext) {
	a.characters = characters
	runtime.EventsEmit(a.ctx, "characters:loaded", len(characters))
}

// SetLorebooks sets the lorebook entries directly
func (a *App) SetLorebooks(lorebooks []lorebook.Entry) {
	a.lorebooks = lorebooks
	runtime.EventsEmit(a.ctx, "lorebook:loaded", len(lorebooks))
}

// GetSamplerSettings returns the current sampler settings
func (a *App) GetSamplerSettings() map[string]interface{} {
	return a.samplerSettings
}

// SetSamplerSettings sets the sampler settings
func (a *App) SetSamplerSettings(settings map[string]interface{}) {
	a.samplerSettings = settings
	runtime.EventsEmit(a.ctx, "sampler:updated", settings)
}

// GetModelSettings returns the current model settings
func (a *App) GetModelSettings() map[string]interface{} {
	return a.modelSettings
}

// SetModelSettings sets the model settings
func (a *App) SetModelSettings(settings map[string]interface{}) {
	a.modelSettings = settings
	runtime.EventsEmit(a.ctx, "model:updated", settings)
}

// InitializeChatPersistence initializes the chat persistence manager
func (a *App) InitializeChatPersistence(historyDir string) error {
	if historyDir == "" {
		historyDir = filepath.Join(filepath.Dir(os.Args[0]), "history")
	}
	if err := os.MkdirAll(historyDir, 0755); err != nil {
		return fmt.Errorf("create history directory: %w", err)
	}

	persistence, err := chat.NewPersistenceManager(historyDir)
	if err != nil {
		return fmt.Errorf("initialize persistence: %w", err)
	}

	a.chatPersistence = persistence
	runtime.EventsEmit(a.ctx, "persistence:initialized", historyDir)
	return nil
}

// LoadChatHistory loads chat history from the most recent file
func (a *App) LoadChatHistory(chatID string) error {
	if a.chatPersistence == nil {
		return fmt.Errorf("persistence not initialized")
	}

	history, err := a.chatPersistence.LoadHistory(chatID)
	if err != nil {
		return fmt.Errorf("load history: %w", err)
	}

	a.chatMessages = history
	runtime.EventsEmit(a.ctx, "history:loaded", chatID)
	return nil
}

// SaveChatHistory saves the current chat history to a new file
func (a *App) SaveChatHistory() (string, error) {
	if a.chatPersistence == nil {
		return "", fmt.Errorf("persistence not initialized")
	}

	chatID, err := a.chatPersistence.SaveHistory(a.chatMessages)
	if err != nil {
		return "", fmt.Errorf("save history: %w", err)
	}

	runtime.EventsEmit(a.ctx, "history:saved", chatID)
	return chatID, nil
}

// ListChatHistory returns all available chat history files
func (a *App) ListChatHistory() ([]chat.ChatMetadata, error) {
	if a.chatPersistence == nil {
		return nil, fmt.Errorf("persistence not initialized")
	}

	return a.chatPersistence.ListHistory()
}

// DeleteChatHistory deletes a chat history file
func (a *App) DeleteChatHistory(chatID string) error {
	if a.chatPersistence == nil {
		return fmt.Errorf("persistence not initialized")
	}

	if err := a.chatPersistence.DeleteHistory(chatID); err != nil {
		return fmt.Errorf("delete history: %w", err)
	}

	runtime.EventsEmit(a.ctx, "history:deleted", chatID)
	return nil
}

// GenerateImage creates an image using the active model.
func (a *App) GenerateImage(opts imagetypes.ImageOptions) (*imagetypes.ImageResult, error) {
	if a.imageEngine == nil {
		return nil, fmt.Errorf("image engine not initialized")
	}
	if a.imageEngine.GetLoadedModel() == nil {
		return nil, fmt.Errorf("no image model loaded")
	}

	var result *imagetypes.ImageResult
	var err error

	switch opts.Mode {
	case "img2img":
		result, err = a.imageEngine.GenerateImg2Img(opts)
	case "inpaint":
		result, err = a.imageEngine.GenerateInpaint(opts)
	default:
		result, err = a.imageEngine.GenerateTxt2Img(opts)
	}
	if err != nil {
		return nil, err
	}

	// Persist to gallery
	if a.gallerySvc != nil && result != nil {
		if err := a.gallerySvc.Save(result); err != nil {
			fmt.Printf("Warning: failed to save to gallery: %v\n", err)
		}
	}

	return result, nil
}

// ListGalleryImages returns all persisted gallery entries.
func (a *App) ListGalleryImages() ([]imagetypes.ImageMetadata, error) {
	if a.gallerySvc == nil {
		return nil, fmt.Errorf("gallery service not initialized")
	}
	return a.gallerySvc.List()
}

// DeleteGalleryImage removes an image from the gallery.
func (a *App) DeleteGalleryImage(baseName string) error {
	if a.gallerySvc == nil {
		return fmt.Errorf("gallery service not initialized")
	}
	return a.gallerySvc.Delete(baseName)
}

// GetGalleryImage reads a gallery image file and returns base64 PNG data.
func (a *App) GetGalleryImage(filePath string) (string, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return "", fmt.Errorf("read image: %w", err)
	}
	return base64.StdEncoding.EncodeToString(data), nil
}

// SaveImageAs shows a save dialog and writes the base64 PNG image to the chosen path.
func (a *App) SaveImageAs(imageDataB64 string) (string, error) {
	data, err := base64.StdEncoding.DecodeString(imageDataB64)
	if err != nil {
		return "", fmt.Errorf("decode image data: %w", err)
	}

	path, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:            "Save Image As",
		DefaultDirectory: a.getGalleryDir(),
		DefaultFilename:  "generated-image.png",
		Filters: []runtime.FileFilter{
			{DisplayName: "PNG Images (*.png)", Pattern: "*.png"},
			{DisplayName: "JPEG Images (*.jpg)", Pattern: "*.jpg;*.jpeg"},
			{DisplayName: "All Files", Pattern: "*.*"},
		},
	})
	if err != nil {
		return "", fmt.Errorf("save dialog: %w", err)
	}
	if path == "" {
		return "", nil // user cancelled
	}

	if err := os.WriteFile(path, data, 0644); err != nil {
		return "", fmt.Errorf("write image: %w", err)
	}
	return path, nil
}

// SaveTempImage decodes a base64 image and writes it to the engine temp directory.
// Returns the absolute file path, which can be passed as InitImagePath to GenerateImage.
func (a *App) SaveTempImage(imageDataB64 string) (string, error) {
	data, err := base64.StdEncoding.DecodeString(imageDataB64)
	if err != nil {
		return "", fmt.Errorf("decode image data: %w", err)
	}

	var tempDir string
	if e, ok := a.imageEngine.(*sdcpp.Engine); ok {
		cfg := e.GetConfig()
		tempDir = cfg.TempDir
	}
	if tempDir == "" {
		tempDir = filepath.Join(os.TempDir(), "howl-image-temp")
	}
	if err := os.MkdirAll(tempDir, 0755); err != nil {
		return "", fmt.Errorf("create temp dir: %w", err)
	}

	timestamp := time.Now().UTC().Format("20060102_150405")
	path := filepath.Join(tempDir, fmt.Sprintf("init_%s.png", timestamp))
	if err := os.WriteFile(path, data, 0644); err != nil {
		return "", fmt.Errorf("write temp image: %w", err)
	}
	return path, nil
}

func (a *App) getGalleryDir() string {
	if a.gallerySvc != nil {
		return a.gallerySvc.BaseDir()
	}
	return filepath.Join(filepath.Dir(os.Args[0]), "images", "gallery")
}

// DebugImageEngine returns raw directory contents and engine config for diagnostics.
func (a *App) DebugImageEngine() map[string]interface{} {
	result := map[string]interface{}{
		"engine_nil": a.imageEngine == nil,
	}
	if a.imageEngine == nil {
		return result
	}
	cfg := a.GetImageEngineConfig()
	result["binary_path"] = cfg.BinaryPath
	result["models_dir"] = cfg.ModelsDir
	result["port"] = cfg.Port

	// List raw files in models dir
	if cfg.ModelsDir != "" {
		entries, err := os.ReadDir(cfg.ModelsDir)
		if err != nil {
			result["read_dir_error"] = err.Error()
		} else {
			var files []map[string]interface{}
			for _, e := range entries {
				info, _ := e.Info()
				f := map[string]interface{}{
					"name":   e.Name(),
					"is_dir": e.IsDir(),
				}
				if info != nil {
					f["size"] = info.Size()
				}
				files = append(files, f)
			}
			result["files"] = files
			result["file_count"] = len(files)
		}
	}
	return result
}

// GetImageEngineConfig returns the current image engine configuration.
func (a *App) GetImageEngineConfig() imagetypes.EngineConfig {
	if e, ok := a.imageEngine.(*sdcpp.Engine); ok {
		return e.GetConfig()
	}
	return imagetypes.EngineConfig{}
}

// SetImageModelsDir updates the models directory and re-initializes the engine.
func (a *App) SetImageModelsDir(dir string) error {
	if dir == "" {
		return fmt.Errorf("models directory cannot be empty")
	}
	if _, err := os.Stat(dir); err != nil {
		return fmt.Errorf("models directory not found: %w", err)
	}

	oldEngine := a.imageEngine
	imgEngine := sdcpp.NewEngine()
	cfg := a.GetImageEngineConfig()
	cfg.ModelsDir = dir
	if err := imgEngine.Initialize(cfg); err != nil {
		return fmt.Errorf("failed to re-initialize image engine: %w", err)
	}
	if oldEngine != nil {
		_ = oldEngine.Shutdown()
	}
	a.imageEngine = imgEngine
	if a.jobManager != nil {
		a.jobManager.SetEngine(imgEngine)
	}
	return nil
}

// SetSDServerPath updates the sd-server binary path and re-initializes the engine.
func (a *App) SetSDServerPath(path string) error {
	if path == "" {
		return fmt.Errorf("sd-server path cannot be empty")
	}
	if _, err := os.Stat(path); err != nil {
		return fmt.Errorf("sd-server binary not found: %w", err)
	}

	oldEngine := a.imageEngine
	imgEngine := sdcpp.NewEngine()
	cfg := a.GetImageEngineConfig()
	cfg.BinaryPath = path
	if err := imgEngine.Initialize(cfg); err != nil {
		return fmt.Errorf("failed to re-initialize image engine: %w", err)
	}
	if oldEngine != nil {
		_ = oldEngine.Shutdown()
	}
	a.imageEngine = imgEngine
	if a.jobManager != nil {
		a.jobManager.SetEngine(imgEngine)
	}
	return nil
}
