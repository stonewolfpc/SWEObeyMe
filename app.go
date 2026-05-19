package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"howl-chat/internal/audio"
	audiotypes "howl-chat/internal/audio/types"
	"howl-chat/internal/backend/chat"
	"howl-chat/internal/backend/gguf"
	"howl-chat/internal/backend/llama"
	"howl-chat/internal/backend/lorebook"
	"howl-chat/internal/backend/memory"
	"howl-chat/internal/backend/model"
	"howl-chat/internal/backend/rag"
	"howl-chat/internal/backend/types"
	imageengine "howl-chat/internal/image/engine"
	"howl-chat/internal/image/engine/sdcpp"
	"howl-chat/internal/image/gallery"
	"howl-chat/internal/image/job"
	imagetypes "howl-chat/internal/image/types"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App represents Wails application
// Contains application context and backend services
type App struct {
	ctx             context.Context
	httpClient      *llama.HTTPClient
	serverProc      *exec.Cmd
	samplerSettings map[string]interface{}
	modelSettings   map[string]interface{}
	chatMessages    []map[string]interface{}
	world           *chat.WorldContext
	scenario        *chat.ScenarioContext
	characters      []*chat.CharacterContext
	lorebooks       []lorebook.Entry
	triggeredLore   map[string]bool
	streamCancel    context.CancelFunc
	chatPersistence *chat.PersistenceManager

	// Service dependencies
	modelManager *model.Manager
	chatService  *chat.Service

	// Memory Service Integration
	memoryService *memory.Service

	// RAG Service Integration
	ragService *rag.Service

	// Audio Pipeline Integration
	audioPipeline *audio.Pipeline

	// Image Generation Engine
	imageEngine imageengine.ImageEngine
	gallerySvc  *gallery.Service
	jobManager  *job.Manager
}

// findLlamaServer returns the path to llama-server.exe, checking next to exe and project root
func findLlamaServer() string {
	candidates := []string{
		filepath.Join(filepath.Dir(os.Args[0]), "llama-server.exe"),
		"llama-server.exe",
		`d:\Fantasy\llama-cpu\llama-server.exe`,
	}
	for _, c := range candidates {
		if _, err := os.Stat(c); err == nil {
			return c
		}
	}
	return ""
}

// intSetting extracts an int from a settings map with a fallback default
func intSetting(m map[string]interface{}, key string, def int) string {
	if v, ok := m[key]; ok {
		switch n := v.(type) {
		case float64:
			return fmt.Sprintf("%d", int(n))
		case int:
			return fmt.Sprintf("%d", n)
		}
	}
	return fmt.Sprintf("%d", def)
}

func strSetting(m map[string]interface{}, key string, def string) string {
	if v, ok := m[key].(string); ok && v != "" && v != "auto" {
		return v
	}
	return def
}

// spawnLlamaServerWithModel starts llama-server with a model and all applicable settings
func spawnLlamaServerWithModel(modelPath string, settings map[string]interface{}) (*exec.Cmd, error) {
	serverPath := findLlamaServer()
	if serverPath == "" {
		return nil, fmt.Errorf("llama-server.exe not found")
	}

	args := []string{
		"--host", "127.0.0.1",
		"--port", "8080",
		"-m", modelPath,
		"-c", intSetting(settings, "context_size", 4096),
		"--threads", intSetting(settings, "threads", 8),
		"-b", intSetting(settings, "batch_size", 512),
		"-ngl", intSetting(settings, "gpu_layers", 0),
	}

	// Auto-detect and add mmproj file for vision models
	mmprojPath := findMMProj(modelPath)
	if mmprojPath != "" {
		args = append(args, "--mmproj", mmprojPath)
		fmt.Printf("INFO: Auto-detected mmproj file: %s\n", mmprojPath)
	} else {
		fmt.Printf("INFO: No mmproj file found for model: %s\n", modelPath)
	}

	// Optional: rope scaling (only pass if not "auto" and has value)
	if rs := strSetting(settings, "rope_mode", ""); rs != "" && rs != "auto" {
		args = append(args, "--rope-scaling", rs)
	}
	if v, ok := settings["rope_factor"].(float64); ok && v > 0 && v != 1.0 {
		args = append(args, "--rope-scale", fmt.Sprintf("%g", v))
	}
	if v, ok := settings["rope_base"].(float64); ok && v > 0 {
		args = append(args, "--rope-freq-base", fmt.Sprintf("%g", v))
	}

	// Optional: flash attention
	if v, ok := settings["flash_attention"].(bool); ok && v {
		args = append(args, "--flash-attn")
	}

	// Optional: tensor split (multi-GPU)
	if ts := strSetting(settings, "tensor_split", ""); ts != "" && ts != "0" {
		args = append(args, "--tensor-split", ts)
	}

	// Optional: jinja chat template override
	if jinja := strSetting(settings, "custom_jinja_template", ""); jinja != "" {
		args = append(args, "--chat-template", jinja)
	}

	serverDir := filepath.Dir(serverPath)
	cmd := exec.Command(serverPath, args...)
	cmd.Dir = serverDir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("failed to start llama-server: %w", err)
	}
	fmt.Printf("INFO: llama-server started (pid %d) with model %s\n", cmd.Process.Pid, modelPath)
	return cmd, nil
}

// findMMProj searches for an mmproj file in the same directory as the model
// Per llama.cpp docs: mmproj file name must start with "mmproj" (e.g., mmproj-F16.gguf)
func findMMProj(modelPath string) string {
	dir := filepath.Dir(modelPath)
	baseName := filepath.Base(modelPath)

	// Remove extension from model name
	modelName := strings.TrimSuffix(baseName, filepath.Ext(baseName))

	// Try common mmproj naming patterns
	// llama.cpp convention: file name must start with "mmproj"
	patterns := []string{
		filepath.Join(dir, "mmproj-F16.gguf"),
		filepath.Join(dir, "mmproj-Q4_0.gguf"),
		filepath.Join(dir, "mmproj-Q4_K_M.gguf"),
		filepath.Join(dir, "mmproj-Q8_0.gguf"),
		filepath.Join(dir, "mmproj-f16.gguf"),
		filepath.Join(dir, "mmproj-q4_0.gguf"),
		filepath.Join(dir, "mmproj-q4_k_m.gguf"),
		filepath.Join(dir, "mmproj-q8_0.gguf"),
		filepath.Join(dir, "mmproj.gguf"),
		filepath.Join(dir, modelName+"-mmproj.gguf"),
		filepath.Join(dir, modelName+".mmproj.gguf"),
	}

	for _, pattern := range patterns {
		if _, err := os.Stat(pattern); err == nil {
			return pattern
		}
	}

	// No mmproj file found - do NOT scan directory
	// This prevents picking up unrelated files like tokenizer.gguf
	return ""
}

// getProjectRoot returns the project root directory, preferring the current working directory
func getProjectRoot() string {
	cwd, err := os.Getwd()
	if err == nil {
		return cwd
	}
	return filepath.Dir(os.Args[0])
}

// findSDServer searches common locations for the sd-server.exe binary
func findSDServer() string {
	candidates := []string{
		`D:\StableDiffusion\sd-server.exe`,
		`D:\stable-diffusion.cpp\build\bin\Release\sd-server.exe`,
		`D:\stable-diffusion.cpp\build\bin\sd-server.exe`,
		`D:\stable-diffusion.cpp\sd-server.exe`,
		`D:\sd.cpp\sd-server.exe`,
		filepath.Join(getProjectRoot(), "sd-server.exe"),
	}
	for _, p := range candidates {
		if _, err := os.Stat(p); err == nil {
			return p
		}
	}
	return ""
}

// NewApp creates a new instance of the App struct
// Initializes backend services with llama-server HTTP client
func NewApp() *App {
	client := llama.NewHTTPClient("localhost", 8080, true)

	// Initialize model manager
	modelManager := model.NewManager(client)

	// Initialize chat persistence manager
	chatPersistence, err := chat.NewPersistenceManager()
	if err != nil {
		// Log error but don't fail app startup
		fmt.Printf("Warning: Failed to initialize chat persistence: %v\n", err)
		chatPersistence = nil
	}

	// Initialize memory service
	memoryService := memory.NewService("default") // Default chat ID for initial setup

	// Initialize chat service
	chatService, err := chat.NewService(modelManager, client, "", "", []string{}, "")
	if err != nil {
		fmt.Printf("Warning: Failed to initialize chat service: %v\n", err)
		chatService = nil
	}

	// Initialize RAG service (uses llama-server embedding endpoint if available)
	var ragService *rag.Service
	var ragEmbedder rag.Embedder
	if client != nil {
		ragEmbedder = rag.NewLlamaEmbedder(client)
	} else {
		ragEmbedder = rag.NewKeywordEmbedder()
	}
	ragService = rag.NewService("d:\\HOWL_Chat", ragEmbedder)
	if chatService != nil {
		chatService.SetRAGService(ragService)
		chatService.SetRAGEnabled(true)
	}

	// Default sampler settings
	defaultSettings := map[string]interface{}{
		"temperature":                0.7,
		"top_p_enabled":              true,
		"top_p":                      0.9,
		"top_k":                      40,
		"min_p":                      0.05,
		"repeat_penalty":             1.1,
		"repeat_last_n":              64,
		"frequency_penalty_enabled":  true,
		"frequency_penalty":          0.0,
		"presence_penalty_enabled":   true,
		"presence_penalty":           0.0,
		"typical_p_enabled":          true,
		"typical_p":                  1.0,
		"mirostat_enabled":           true,
		"mirostat":                   0,
		"mirostat_tau":               5.0,
		"mirostat_eta":               0.1,
		"dynamic_temp_range_enabled": true,
		"dynamic_temp_range":         0.0,
		"dynamic_temp_exponent":      1.0,
		"dry_multiplier":             0.0,
		"dry_allowed_length":         2,
		"dry_base":                   1.0,
		"smoothing_factor":           0.0,
		"smoothing_curve":            1.0,
		"top_a_enabled":              true,
		"top_a":                      0.0,
		"epsilon_cutoff":             0.0,
		"eta_cutoff":                 0.0,
		"encoder_repeat_penalty":     1.0,
		"no_repeat_ngram_size":       0,
		"seed":                       -1,
	}

	// Initialize image generation engine (lazy: paths can be set later via UI)
	imgEngine := sdcpp.NewEngine()
	projectRoot := getProjectRoot()
	binaryPath := findSDServer()
	if binaryPath == "" {
		binaryPath = filepath.Join(projectRoot, "sd-server.exe")
	}
	imgConfig := imagetypes.EngineConfig{
		BinaryPath: binaryPath,
		ModelsDir:  filepath.Join(projectRoot, "models"),
		OutputDir:  filepath.Join(projectRoot, "images", "gallery"),
		TempDir:    filepath.Join(os.TempDir(), "howl-image-temp"),
		Port:       8081,
	}
	if err := imgEngine.Initialize(imgConfig); err != nil {
		fmt.Printf("INFO: Image engine not ready (paths not configured yet): %v\n", err)
		imgEngine = nil
	}

	galleryService := gallery.NewService(imgConfig.OutputDir)
	jobMgr := job.NewManager(imgEngine)

	app := &App{
		httpClient:      client,
		serverProc:      nil,
		samplerSettings: defaultSettings,
		modelSettings:   make(map[string]interface{}),
		chatMessages:    []map[string]interface{}{},
		chatPersistence: chatPersistence,
		modelManager:    modelManager,
		chatService:     chatService,
		memoryService:   memoryService,
		ragService:      ragService,
		imageEngine:     imgEngine,
		gallerySvc:      galleryService,
		jobManager:      jobMgr,
	}

	app.jobManager.SetOnComplete(func(id string, result *imagetypes.ImageResult) {
		if app.gallerySvc != nil && result != nil {
			if err := app.gallerySvc.Save(result); err != nil {
				fmt.Printf("Warning: failed to save gallery from job %s: %v\n", id, err)
			} else {
				fmt.Printf("[App] Job %s result saved to gallery\n", id)
			}
		}
	})

	return app
}

// startup is called when the application is starting up
// Initializes the application context and optional audio pipeline
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.initAudioPipeline()
}

// initAudioPipeline creates and initializes the audio pipeline if binaries are available.
// It is best-effort: if whisper-cli or piper are not installed, audio stays disabled.
func (a *App) initAudioPipeline() {
	pipe := audio.NewPipeline()
	cfg := audiotypes.PipelineConfig{
		ASREnabled:        false, // User must enable via settings
		TTSEnabled:        false, // User must enable via settings
		MultimodalEnabled: false,
		RealtimeEnabled:   false,
		HardwareTier:      "auto",
	}
	if err := pipe.Initialize(context.Background(), cfg); err != nil {
		fmt.Printf("Audio pipeline init skipped: %v\n", err)
		return
	}
	a.audioPipeline = pipe
	fmt.Println("Audio pipeline initialized successfully")
}

// OnShutdown is called when the application is shutting down
// Performs cleanup operations before application termination
func (a *App) OnShutdown(ctx context.Context) {
	// Save current chat before shutting down
	if a.chatPersistence != nil {
		a.performFinalSave()
	}

	if a.serverProc != nil && a.serverProc.Process != nil {
		_ = a.serverProc.Process.Kill()
		_, _ = a.serverProc.Process.Wait()
	}

	// Shutdown audio pipeline if initialized
	if a.audioPipeline != nil {
		_ = a.audioPipeline.Shutdown(ctx)
	}
}

// Chat Management Wails Bindings

// GetChatList returns a list of all chat summaries
func (a *App) GetChatList() ([]chat.ChatSummary, error) {
	if a.chatPersistence == nil {
		return []chat.ChatSummary{}, fmt.Errorf("chat persistence not initialized")
	}
	return a.chatPersistence.GetChatList()
}

// GetActiveChatMeta returns the metadata for the active chat
func (a *App) GetActiveChatMeta() (*chat.ChatMeta, error) {
	if a.chatPersistence == nil {
		return nil, fmt.Errorf("chat persistence not initialized")
	}
	return a.chatPersistence.GetActiveChatMeta()
}

// NewChat creates a new chat with the given name
func (a *App) NewChat(name string) (*chat.ChatMeta, error) {
	if a.chatPersistence == nil {
		return nil, fmt.Errorf("chat persistence not initialized")
	}

	chatData, err := a.chatPersistence.NewChat(name)
	if err != nil {
		return nil, err
	}

	// Clear current chat messages
	a.chatMessages = []map[string]interface{}{}
	a.triggeredLore = map[string]bool{}
	if a.memoryService != nil {
		a.memoryService.SetChatID(chatData.Meta.ID)
	}

	return &chatData.Meta, nil
}

// SaveChat consolidates the append log into a canonical snapshot.
// Called by the frontend after each complete turn. Does not re-read the full
// chat from disk — the ndjson log written by AppendChatMessage is the source.
func (a *App) SaveChat() error {
	if a.chatPersistence == nil {
		return fmt.Errorf("chat persistence not initialized")
	}

	chatID := a.chatPersistence.GetLastChatID()
	if chatID == "" {
		return fmt.Errorf("no active chat to save")
	}

	// Build history from in-memory messages (mirrors what ndjson holds)
	history := a.buildChatHistory()

	// Load just the metadata shell — avoids re-parsing the full history from disk
	chatMeta, err := a.chatPersistence.GetActiveChatMeta()
	if err != nil {
		// Fall back to full save if meta unavailable
		return a.performSave()
	}

	// Build lorebook entries for persistence
	lorebookEntries := make([]interface{}, 0, len(a.lorebooks))
	for _, lb := range a.lorebooks {
		lorebookEntries = append(lorebookEntries, map[string]interface{}{
			"id":      lb.ID,
			"title":   lb.Title,
			"content": lb.Content,
		})
	}

	chatData := &chat.ChatData{
		Meta:       *chatMeta,
		History:    history,
		World:      a.world,
		Scenario:   a.scenario,
		Characters: a.characters,
		Lorebooks:  lorebookEntries,
	}
	chatData.Meta.UpdatedAt = time.Now().UTC().Format(time.RFC3339)

	return a.chatPersistence.SaveChat(chatData)
}

// buildChatHistory converts a.chatMessages to []chat.ChatHistory.
// Extracted so both SaveChat and updateChatDataFromAppState share the same logic.
func (a *App) buildChatHistory() []chat.ChatHistory {
	history := make([]chat.ChatHistory, 0, len(a.chatMessages))
	for _, msg := range a.chatMessages {
		role, _ := msg["role"].(string)
		content, _ := msg["content"].(string)
		if strings.TrimSpace(content) == "" {
			continue
		}
		sender := "System"
		switch role {
		case "user":
			if s, ok := msg["sender"].(string); ok && s != "" {
				sender = s
			} else {
				sender = "User"
			}
		case "assistant":
			if c, ok := msg["character"].(string); ok && c != "" {
				sender = c
			} else if s, ok := msg["sender"].(string); ok && s != "" {
				sender = s
			} else {
				sender = "Assistant"
			}
		}
		history = append(history, chat.ChatHistory{
			ID:        fmt.Sprintf("%d", len(history)),
			Sender:    sender,
			Text:      content,
			Role:      role,
			Timestamp: time.Now().Format(time.RFC3339),
		})
	}
	return history
}

// SaveChatAs creates a copy of the current chat with a new name
func (a *App) SaveChatAs(name string) (*chat.ChatMeta, error) {
	if a.chatPersistence == nil {
		return nil, fmt.Errorf("chat persistence not initialized")
	}

	lastChatID := a.chatPersistence.GetLastChatID()
	if lastChatID == "" {
		return nil, fmt.Errorf("no active chat to save")
	}

	chatData, err := a.chatPersistence.SaveChatAs(lastChatID, name)
	if err != nil {
		return nil, err
	}
	if a.memoryService != nil {
		a.memoryService.SetChatID(chatData.Meta.ID)
	}

	return &chatData.Meta, nil
}

// LoadChat loads a chat by ID and returns complete chat data
func (a *App) LoadChat(chatID string) (*chat.ChatData, error) {
	if a.chatPersistence == nil {
		return nil, fmt.Errorf("chat persistence not initialized")
	}

	// Save current chat before switching, but never self-overwrite the same chat.
	lastChatID := a.chatPersistence.GetLastChatID()
	if lastChatID != "" && lastChatID != chatID {
		if err := a.performSave(); err != nil {
			fmt.Printf("Warning: Failed to save current chat: %v\n", err)
		}
	}

	// Load the target chat
	chatData, err := a.chatPersistence.LoadChat(chatID)
	if err != nil {
		return nil, err
	}

	// Update app state
	a.updateAppStateFromChat(chatData)

	// Set as active chat
	if err := a.chatPersistence.SetLastChatID(chatID); err != nil {
		return nil, fmt.Errorf("failed to set active chat: %w", err)
	}

	// Keep memory operations scoped to the loaded chat.
	if a.memoryService != nil {
		a.memoryService.SetChatID(chatID)
	}

	// Return complete chat data including world, scenario, characters, and lorebooks
	return chatData, nil
}

// DeleteChat deletes a chat by ID and wipes its directory from disk.
// If the deleted chat was the active session, in-memory state is cleared.
func (a *App) DeleteChat(chatID string) error {
	if a.chatPersistence == nil {
		return fmt.Errorf("chat persistence not initialized")
	}

	// If deleting the currently active chat, reset in-memory state
	if a.chatPersistence.GetLastChatID() == chatID {
		a.world = nil
		a.scenario = nil
		a.characters = []*chat.CharacterContext{}
		a.lorebooks = nil
		a.chatMessages = []map[string]interface{}{}
		a.triggeredLore = map[string]bool{}
	}

	return a.chatPersistence.DeleteChat(chatID)
}

// ClearWorldFromSession removes the active world from in-memory state and persists.
// Called by the frontend when a world is permanently deleted while it is active.
func (a *App) ClearWorldFromSession() error {
	a.world = nil
	if a.chatPersistence != nil {
		if chatID := a.chatPersistence.GetLastChatID(); chatID != "" {
			_ = a.performSave()
		}
	}
	return nil
}

// ClearScenarioFromSession removes the active scenario from in-memory state and persists.
// Called by the frontend when a scenario is permanently deleted while it is active.
func (a *App) ClearScenarioFromSession() error {
	a.scenario = nil
	if a.chatPersistence != nil {
		if chatID := a.chatPersistence.GetLastChatID(); chatID != "" {
			_ = a.performSave()
		}
	}
	return nil
}

// ExitApp performs final save and exits the application
func (a *App) ExitApp() error {
	if a.chatPersistence != nil {
		a.performFinalSave()
	}

	// Trigger application shutdown
	runtime.Quit(a.ctx)
	return nil
}

// Helper functions

// performSave saves the current app state to the active chat
func (a *App) performSave() error {
	lastChatID := a.chatPersistence.GetLastChatID()
	if lastChatID == "" {
		return fmt.Errorf("no active chat to save")
	}

	// Load existing chat data
	chatData, err := a.chatPersistence.LoadChat(lastChatID)
	if err != nil {
		return err
	}

	// Update chat data with current app state
	a.updateChatDataFromAppState(chatData)

	// Save the updated chat data
	return a.chatPersistence.SaveChat(chatData)
}

// performFinalSave performs the final save before application exit
func (a *App) performFinalSave() {
	if err := a.performSave(); err != nil {
		fmt.Printf("Final save failed: %v\n", err)
	}
}

// updateChatDataFromAppState updates chat data with current app state
func (a *App) updateChatDataFromAppState(chatData *chat.ChatData) {
	history := a.buildChatHistory()
	// Keep existing persisted history if frontend/backend has not populated message state yet.
	if len(history) > 0 || len(chatData.History) == 0 {
		chatData.History = history
	}
	chatData.Meta.UpdatedAt = time.Now().UTC().Format(time.RFC3339)

	// Update World, Scenario, Characters from app state.
	// Only overwrite with nil if the in-memory state was explicitly cleared;
	// otherwise preserve whatever was loaded from disk (prevents refresh clobbering).
	if a.world != nil {
		chatData.World = a.world
	}
	if a.scenario != nil {
		chatData.Scenario = a.scenario
	}
	if a.characters != nil {
		chatData.Characters = a.characters
	}

	// Preserve lore/memory context across shutdown and chat switches.
	lorebookItems := make([]interface{}, 0, len(a.lorebooks))
	lorebookNames := make([]string, 0, len(a.lorebooks))
	for _, lb := range a.lorebooks {
		lorebookItems = append(lorebookItems, map[string]interface{}{
			"id":      lb.ID,
			"title":   lb.Title,
			"content": lb.Content,
			"tags":    lb.Tags,
		})
		if lb.Title != "" {
			lorebookNames = append(lorebookNames, lb.Title)
		}
	}
	chatData.Lorebooks = lorebookItems

	if chatData.Memories == nil {
		chatData.Memories = []interface{}{}
	}

	if chatData.Meta.WorldName == "" && a.world != nil {
		chatData.Meta.WorldName = a.world.Name
	}
	if chatData.Meta.ScenarioName == "" && a.scenario != nil {
		chatData.Meta.ScenarioName = a.scenario.Name
	}
	if len(a.characters) > 0 {
		charNames := make([]string, 0, len(a.characters))
		for _, c := range a.characters {
			if c != nil && c.Name != "" {
				charNames = append(charNames, c.Name)
			}
		}
		chatData.Meta.CharacterNames = charNames
	}
	chatData.Meta.LorebookNames = lorebookNames
}

// updateAppStateFromChat updates app state from loaded chat data
func (a *App) updateAppStateFromChat(chatData *chat.ChatData) {
	// Update app state from loaded chat data

	// Convert ChatHistory back to chat messages format
	a.chatMessages = []map[string]interface{}{}
	for _, history := range chatData.History {
		msg := map[string]interface{}{
			"role":    history.Role,
			"content": history.Text,
		}
		a.chatMessages = append(a.chatMessages, msg)
	}

	// Update world, scenario, and characters
	a.world = chatData.World
	a.scenario = chatData.Scenario
	a.characters = chatData.Characters

	// Reset triggered lore
	a.triggeredLore = map[string]bool{}
}

// SendMessage sends a message to the chat service and returns the AI response
// This is a Wails binding that can be called from the frontend
func (a *App) SendMessage(message string) (string, error) {
	if a.httpClient == nil {
		return "", fmt.Errorf("llama client not initialized")
	}

	a.chatMessages = append(a.chatMessages, map[string]interface{}{
		"role":      "user",
		"content":   message,
		"timestamp": time.Now().Unix(),
	})

	// Build prompt from chat messages and triggered lore
	prompt := a.buildPrompt()

	// Convert sampler settings to InferenceOptions
	opts := llama.NewInferenceOptions()
	if s := a.samplerSettings; s != nil {
		if v, ok := s["temperature"].(float64); ok {
			opts.Temperature = v
		}
		if v, ok := s["top_p_enabled"].(bool); ok {
			opts.TopPEnabled = v
		}
		if v, ok := s["top_p"].(float64); ok {
			if opts.TopPEnabled {
				opts.TopP = v
			} else {
				opts.TopP = 1.0
			}
		}
		if v, ok := s["top_k"].(float64); ok {
			opts.TopK = int(v)
		}
		if v, ok := s["min_p"].(float64); ok {
			opts.MinP = v
		}
		if v, ok := s["typical_p_enabled"].(bool); ok {
			opts.TypicalPEnabled = v
		}
		if v, ok := s["typical_p"].(float64); ok {
			opts.TypicalP = v
		}
		if v, ok := s["repeat_penalty"].(float64); ok {
			opts.RepeatPenalty = v
		}
		if v, ok := s["repeat_last_n"].(float64); ok {
			opts.RepeatLastN = int(v)
		}
		if v, ok := s["frequency_penalty_enabled"].(bool); ok {
			opts.FrequencyPenaltyEnabled = v
		}
		if v, ok := s["frequency_penalty"].(float64); ok {
			opts.FrequencyPenalty = v
		}
		if v, ok := s["presence_penalty_enabled"].(bool); ok {
			opts.PresencePenaltyEnabled = v
		}
		if v, ok := s["presence_penalty"].(float64); ok {
			opts.PresencePenalty = v
		}
		if v, ok := s["mirostat_enabled"].(bool); ok {
			opts.MirostatEnabled = v
		}
		if v, ok := s["mirostat"].(float64); ok {
			opts.Mirostat = int(v)
		}
		if v, ok := s["mirostat_tau"].(float64); ok {
			opts.MirostatTau = v
		}
		if v, ok := s["mirostat_eta"].(float64); ok {
			opts.MirostatETA = v
		}
		if v, ok := s["dynamic_temp_range_enabled"].(bool); ok {
			opts.DynamicTempRangeEnabled = v
		}
		if v, ok := s["dynamic_temp_range"].(float64); ok {
			opts.DynamicTempRange = v
		}
		if v, ok := s["dynamic_temp_exponent"].(float64); ok {
			opts.DynamicTempExponent = v
		}
		if v, ok := s["dry_multiplier"].(float64); ok {
			opts.DRYMultiplier = v
		}
		if v, ok := s["dry_allowed_length"].(float64); ok {
			opts.DRYAllowedLength = int(v)
		}
		if v, ok := s["dry_base"].(float64); ok {
			opts.DRYBase = v
		}
		if v, ok := s["smoothing_factor"].(float64); ok {
			opts.SmoothingFactor = v
		}
		if v, ok := s["smoothing_curve"].(float64); ok {
			opts.SmoothingCurve = v
		}
		if v, ok := s["top_a_enabled"].(bool); ok {
			opts.TopAEnabled = v
		}
		if v, ok := s["top_a"].(float64); ok {
			opts.TopA = v
		}
		if v, ok := s["epsilon_cutoff"].(float64); ok {
			opts.EpsilonCutoff = v
		}
		if v, ok := s["eta_cutoff"].(float64); ok {
			opts.EtaCutoff = v
		}
		if v, ok := s["no_repeat_ngram"].(float64); ok {
			opts.NoRepeatNGramSize = int(v)
		}
		if v, ok := s["encoder_repeat_penalty"].(float64); ok {
			opts.EncoderRepeatPenalty = v
		}
		if v, ok := s["seed"].(float64); ok {
			opts.Seed = int(v)
		}
	}

	// Apply hard-kill stop sequences from model settings or defaults
	stopSequences := []string{"<|im_end|>", "\nUser:", "System:", "\n<|think>"}
	if ms := a.modelSettings; ms != nil {
		if customStops, ok := ms["stop_sequences"].([]string); ok && len(customStops) > 0 {
			stopSequences = customStops
		}
	}
	opts.StopStrings = stopSequences

	// Generate response
	response, err := a.httpClient.Generate(prompt, opts)
	if err != nil {
		return "", err
	}

	a.chatMessages = append(a.chatMessages, map[string]interface{}{
		"role":      "assistant",
		"content":   response,
		"timestamp": time.Now().Unix(),
	})

	// Trigger autosave after message exchange
	if a.chatPersistence != nil {
		go func() {
			if err := a.performSave(); err != nil {
				fmt.Printf("Autosave failed: %v\n", err)
			}
		}()
	}

	return response, nil
}

// SendMessageStream sends a message and streams the response via Wails events
// Emits: chat:start, chat:chunk (for each token), chat:complete, chat:error
func (a *App) SendMessageStream(message string) error {
	return a.SendMessageStreamWithImage(message, "")
}

// SendMessageStreamWithImage sends a message with optional image and streams the response
func (a *App) SendMessageStreamWithImage(message string, imageData string) error {
	if a.httpClient == nil {
		return fmt.Errorf("llama client not initialized")
	}

	// Decode base64 image data if provided
	var imageBytes []byte
	var err error
	if imageData != "" {
		imageBytes, err = base64.StdEncoding.DecodeString(imageData)
		if err != nil {
			return fmt.Errorf("failed to decode image data: %w", err)
		}
	}

	// Add user message to history first
	a.chatMessages = append(a.chatMessages, map[string]interface{}{
		"role":      "user",
		"content":   message,
		"timestamp": time.Now().Unix(),
	})

	// Build prompt from chat messages
	prompt := a.buildPrompt()

	// Convert sampler settings to InferenceOptions
	opts := llama.NewInferenceOptions()
	if s := a.samplerSettings; s != nil {
		if v, ok := s["temperature"].(float64); ok {
			opts.Temperature = v
		}
		if v, ok := s["top_p_enabled"].(bool); ok {
			opts.TopPEnabled = v
		}
		if v, ok := s["top_p"].(float64); ok {
			if opts.TopPEnabled {
				opts.TopP = v
			} else {
				opts.TopP = 1.0
			}
		}
		if v, ok := s["top_k"].(float64); ok {
			opts.TopK = int(v)
		}
		if v, ok := s["min_p"].(float64); ok {
			opts.MinP = v
		}
		if v, ok := s["typical_p_enabled"].(bool); ok {
			opts.TypicalPEnabled = v
		}
		if v, ok := s["typical_p"].(float64); ok {
			opts.TypicalP = v
		}
		if v, ok := s["repeat_penalty"].(float64); ok {
			opts.RepeatPenalty = v
		}
		if v, ok := s["repeat_last_n"].(float64); ok {
			opts.RepeatLastN = int(v)
		}
		if v, ok := s["frequency_penalty_enabled"].(bool); ok {
			opts.FrequencyPenaltyEnabled = v
		}
		if v, ok := s["frequency_penalty"].(float64); ok {
			opts.FrequencyPenalty = v
		}
		if v, ok := s["presence_penalty_enabled"].(bool); ok {
			opts.PresencePenaltyEnabled = v
		}
		if v, ok := s["presence_penalty"].(float64); ok {
			opts.PresencePenalty = v
		}
		if v, ok := s["mirostat_enabled"].(bool); ok {
			opts.MirostatEnabled = v
		}
		if v, ok := s["mirostat"].(float64); ok {
			opts.Mirostat = int(v)
		}
		if v, ok := s["mirostat_tau"].(float64); ok {
			opts.MirostatTau = v
		}
		if v, ok := s["mirostat_eta"].(float64); ok {
			opts.MirostatETA = v
		}
		if v, ok := s["dynamic_temp_range_enabled"].(bool); ok {
			opts.DynamicTempRangeEnabled = v
		}
		if v, ok := s["dynamic_temp_range"].(float64); ok {
			opts.DynamicTempRange = v
		}
		if v, ok := s["dynamic_temp_exponent"].(float64); ok {
			opts.DynamicTempExponent = v
		}
		if v, ok := s["dry_multiplier"].(float64); ok {
			opts.DRYMultiplier = v
		}
		if v, ok := s["dry_allowed_length"].(float64); ok {
			opts.DRYAllowedLength = int(v)
		}
		if v, ok := s["dry_base"].(float64); ok {
			opts.DRYBase = v
		}
		if v, ok := s["smoothing_factor"].(float64); ok {
			opts.SmoothingFactor = v
		}
		if v, ok := s["smoothing_curve"].(float64); ok {
			opts.SmoothingCurve = v
		}
		if v, ok := s["top_a_enabled"].(bool); ok {
			opts.TopAEnabled = v
		}
		if v, ok := s["top_a"].(float64); ok {
			opts.TopA = v
		}
		if v, ok := s["epsilon_cutoff"].(float64); ok {
			opts.EpsilonCutoff = v
		}
		if v, ok := s["eta_cutoff"].(float64); ok {
			opts.EtaCutoff = v
		}
		if v, ok := s["no_repeat_ngram"].(float64); ok {
			opts.NoRepeatNGramSize = int(v)
		}
		if v, ok := s["encoder_repeat_penalty"].(float64); ok {
			opts.EncoderRepeatPenalty = v
		}
		if v, ok := s["seed"].(float64); ok {
			opts.Seed = int(v)
		}
	}

	// Apply hard-kill stop sequences from model settings or defaults
	stopSequences := []string{"<|im_end|>", "\nUser:", "System:", "\n<|think>"}
	if ms := a.modelSettings; ms != nil {
		if customStops, ok := ms["stop_sequences"].([]string); ok && len(customStops) > 0 {
			stopSequences = customStops
		}
	}
	opts.StopStrings = stopSequences

	// Create cancellable context for this stream
	streamCtx, cancel := context.WithCancel(context.Background())
	a.streamCancel = cancel

	// Emit start event
	runtime.EventsEmit(a.ctx, "chat:start")

	var response strings.Builder

	// Stream the response with or without image
	chunkCount := 0
	if len(imageBytes) > 0 {
		fmt.Printf("DEBUG: Starting image stream with prompt len=%d, image size=%d bytes\n", len(prompt), len(imageBytes))
		err := a.httpClient.GenerateStreamWithImage(prompt, imageBytes, opts, func(chunk string, done bool) {
			select {
			case <-streamCtx.Done():
				// Stream was cancelled
				fmt.Printf("DEBUG: Stream cancelled by context\n")
				return
			default:
				if done {
					fmt.Printf("DEBUG: Image stream completed, total chunks emitted=%d, response len=%d\n", chunkCount, response.Len())
					return
				}
				response.WriteString(chunk)
				runtime.EventsEmit(a.ctx, "chat:chunk", chunk)
				chunkCount++
				if chunkCount <= 5 || chunkCount%50 == 0 {
					fmt.Printf("DEBUG: Emitting chat:chunk #%d, len=%d: %q\n", chunkCount, len(chunk), chunk[:min(50, len(chunk))])
				}
			}
		})
		if err != nil {
			fmt.Printf("DEBUG: Image stream error: %v\n", err)
			runtime.EventsEmit(a.ctx, "chat:error", err.Error())
			return err
		}
		fmt.Printf("DEBUG: Image stream finished successfully, chunks=%d, response len=%d\n", chunkCount, response.Len())
	} else {
		err := a.httpClient.GenerateStream(prompt, opts, func(chunk string, done bool) {
			select {
			case <-streamCtx.Done():
				return
			default:
				if done {
					return
				}
				response.WriteString(chunk)
				runtime.EventsEmit(a.ctx, "chat:chunk", chunk)
			}
		})
		if err != nil {
			runtime.EventsEmit(a.ctx, "chat:error", err.Error())
			return err
		}
	}

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
		role, _ := msg["role"].(string)
		content, _ := msg["content"].(string)

		// Apply prefix overrides if configured
		if role == "user" && userPrefix != "" {
			content = userPrefix + content
		} else if role == "assistant" && assistantPrefix != "" {
			content = assistantPrefix + content
		}

		prompt.WriteString(fmt.Sprintf("<|im_start|>%s\n%s<|im_end|>\n", role, content))
	}

	// 5. ASSISTANT TRIGGER
	prompt.WriteString("<|im_start|>assistant\n")
	return prompt.String()
}

func (a *App) resolveLorePromptBlock() string {
	if len(a.lorebooks) == 0 || len(a.chatMessages) == 0 {
		return ""
	}

	lastMessage := ""
	history := make([]lorebook.Message, 0, min(len(a.chatMessages), 6))
	start := len(a.chatMessages) - 6
	if start < 0 {
		start = 0
	}

	for i, msg := range a.chatMessages[start:] {
		role, _ := msg["role"].(string)
		content, _ := msg["content"].(string)
		if strings.TrimSpace(content) == "" {
			continue
		}
		if start+i == len(a.chatMessages)-1 && role == "user" {
			lastMessage = content
		} else {
			history = append(history, lorebook.Message{Role: role, Content: content})
		}
	}

	if lastMessage == "" {
		return ""
	}

	resolved := lorebook.Resolve(a.lorebooks, lorebook.ResolveRequest{
		Message:       lastMessage,
		History:       history,
		Actor:         lorebook.TriggerUser,
		Triggered:     a.triggeredLore,
		MaxEntries:    8,
		MaxCharacters: 2400,
	})

	if len(resolved) == 0 {
		return ""
	}

	if a.triggeredLore == nil {
		a.triggeredLore = map[string]bool{}
	}
	for _, entry := range resolved {
		if entry.TriggerFrequency != lorebook.FrequencyAlways {
			a.triggeredLore[entry.ID] = true
		}
	}

	// Route by active character scope if characters are loaded
	characterName := ""
	if len(a.characters) > 0 {
		characterName = a.characters[0].Name
	}
	scenarioName := ""
	if a.scenario != nil {
		scenarioName = a.scenario.Name
	}
	worldName := ""
	if a.world != nil {
		worldName = a.world.Name
	}
	characterEntries := lorebook.RouteResolvedEntries(resolved, characterName, scenarioName, worldName)
	return lorebook.BuildPromptBlock(characterEntries)
}

// resolveCharacterLorePromptBlock resolves lorebooks against the last user message
// and routes them by scope so only entries relevant to the given character are returned.
func (a *App) resolveCharacterLorePromptBlock(characterName string) string {
	if len(a.lorebooks) == 0 || len(a.chatMessages) == 0 {
		return ""
	}

	lastMessage := ""
	history := make([]lorebook.Message, 0, min(len(a.chatMessages), 6))
	start := len(a.chatMessages) - 6
	if start < 0 {
		start = 0
	}

	for i, msg := range a.chatMessages[start:] {
		role, _ := msg["role"].(string)
		content, _ := msg["content"].(string)
		if strings.TrimSpace(content) == "" {
			continue
		}
		if start+i == len(a.chatMessages)-1 && role == "user" {
			lastMessage = content
		} else {
			history = append(history, lorebook.Message{Role: role, Content: content})
		}
	}

	if lastMessage == "" {
		return ""
	}

	resolved := lorebook.Resolve(a.lorebooks, lorebook.ResolveRequest{
		Message:       lastMessage,
		History:       history,
		Actor:         lorebook.TriggerUser,
		Triggered:     a.triggeredLore,
		MaxEntries:    8,
		MaxCharacters: 2400,
	})

	if len(resolved) == 0 {
		return ""
	}

	if a.triggeredLore == nil {
		a.triggeredLore = map[string]bool{}
	}
	for _, entry := range resolved {
		if entry.TriggerFrequency != lorebook.FrequencyAlways {
			a.triggeredLore[entry.ID] = true
		}
	}

	scenarioName := ""
	if a.scenario != nil {
		scenarioName = a.scenario.Name
	}
	worldName := ""
	if a.world != nil {
		worldName = a.world.Name
	}
	characterEntries := lorebook.RouteResolvedEntries(resolved, characterName, scenarioName, worldName)
	return lorebook.BuildPromptBlock(characterEntries)
}

// ClearChatHistory clears the backend chat history
// This is a Wails binding that can be called from the frontend
func (a *App) ClearChatHistory() error {
	a.chatMessages = []map[string]interface{}{}
	a.triggeredLore = map[string]bool{}
	return nil
}

// AddSystemMessage appends a system-level event to the chat history.
// This is used for narrator-style step-out or death events.
func (a *App) AddSystemMessage(content string) error {
	a.chatMessages = append(a.chatMessages, map[string]interface{}{
		"role":      "system",
		"content":   content,
		"timestamp": time.Now().Unix(),
	})
	return nil
}

// SetLorebooks receives full lorebook objects from the frontend and replaces the
// active pool.  Wails cannot auto-convert JS objects into typed []lorebook.Entry,
// so this binding accepts []map[string]interface{} and parses each entry.
func (a *App) SetLorebooks(entries []map[string]interface{}) error {
	parsed := make([]lorebook.Entry, 0, len(entries))
	for _, m := range entries {
		entry, err := lorebook.ParseLorebookEntryFromMap(m)
		if err != nil {
			fmt.Printf("SetLorebooks: failed to parse entry: %v\n", err)
			continue
		}
		parsed = append(parsed, entry)
	}
	a.lorebooks = parsed
	return nil
}

// UpdateLorebookContext toggles the Enabled flag on existing lorebook entries
// to match the list of active IDs sent from the frontend sidebar.
// Entries whose ID is in the list are enabled; all others are disabled.
func (a *App) UpdateLorebookContext(activeIDs []string) error {
	active := make(map[string]bool, len(activeIDs))
	for _, id := range activeIDs {
		active[id] = true
	}
	for i := range a.lorebooks {
		a.lorebooks[i].Enabled = active[a.lorebooks[i].ID]
	}
	return nil
}

// This is a Wails binding that can be called from the frontend
func (a *App) AbortStream() error {
	// Cancel the HTTP request if using HTTP client
	if a.httpClient != nil {
		a.httpClient.CancelRequest()
	}

	// Cancel the stream context if active
	if a.streamCancel != nil {
		a.streamCancel()
		a.streamCancel = nil
	}

	// Always emit chat:aborted so the frontend send-button resets
	runtime.EventsEmit(a.ctx, "chat:aborted")
	return nil
}

// LoadModel loads a model from the given path
// This is a Wails binding that can be called from the frontend
func (a *App) LoadModel(modelPath string) error {
	if modelPath == "" {
		return fmt.Errorf("model path cannot be empty")
	}

	// Stop any existing llama-server
	if a.serverProc != nil && a.serverProc.Process != nil {
		_ = a.serverProc.Process.Kill()
		_ = a.serverProc.Wait()
		fmt.Printf("INFO: stopped existing llama-server (pid %d)\n", a.serverProc.Process.Pid)
	}

	// Extract GGUF metadata to get chat template
	fmt.Printf("INFO: Reading GGUF metadata from: %s\n", modelPath)
	profile, err := gguf.ExtractModelProfile(modelPath)
	if err != nil {
		fmt.Printf("WARN: Failed to extract GGUF metadata: %v\n", err)
	} else {
		template := profile.Template
		fmt.Printf("INFO: Extracted model profile - Family: %s\n", profile.Family)
		// If we have a chat template and user hasn't set a custom one, use it
		// Allow model's native GGUF metadata to handle formatting
		if template != "" {
			if a.modelSettings == nil {
				a.modelSettings = make(map[string]interface{})
			}
			// Only set if not already configured by user
			if _, exists := a.modelSettings["custom_jinja_template"]; !exists {
				a.modelSettings["custom_jinja_template"] = template
				fmt.Printf("INFO: Using model's native chat template\n")
			}
		}
	}

	// Spawn new llama-server process with current settings
	cmd, err := spawnLlamaServerWithModel(modelPath, a.modelSettings)
	if err != nil {
		return fmt.Errorf("failed to spawn llama-server: %w", err)
	}
	a.serverProc = cmd
	go func() {
		for i := 0; i < 120; i++ {
			time.Sleep(500 * time.Millisecond)
			// Animate progress 0→90% over the wait period
			progress := int(float64(i) / 120.0 * 90.0)
			runtime.EventsEmit(a.ctx, "model:progress", progress)
			if err := a.httpClient.Health(); err == nil {
				fmt.Println("INFO: model loaded and server ready")
				runtime.EventsEmit(a.ctx, "model:progress", 100)
				runtime.EventsEmit(a.ctx, "model:loaded", modelPath)
				return
			}
		}
		fmt.Println("ERROR: llama-server did not become ready after 60s")
		runtime.EventsEmit(a.ctx, "model:error", "server did not become ready after 60s")
	}()
	return nil
}

// UnloadModel kills the llama-server process, freeing all model memory
// This is a Wails binding that can be called from the frontend
func (a *App) UnloadModel() error {
	if a.serverProc != nil && a.serverProc.Process != nil {
		_ = a.serverProc.Process.Kill()
		_ = a.serverProc.Wait()
		a.serverProc = nil
		fmt.Println("INFO: llama-server killed, model memory freed")
	}
	runtime.EventsEmit(a.ctx, "model:unloaded")
	return nil
}

// IsModelLoaded returns true if a model is currently loaded
// This is a Wails binding that can be called from the frontend
func (a *App) IsModelLoaded() bool {
	if a.httpClient == nil {
		return false
	}

	return a.httpClient.IsLoaded()
}

// GetLoadingProgress returns the current model loading progress (0.0-1.0)
// This is a Wails binding that can be called from the frontend
func (a *App) GetLoadingProgress() float64 {
	// HTTP client doesn't provide progress tracking
	return 0.0
}

// GetLoadingStage returns the current loading stage
// This is a Wails binding that can be called from the frontend
func (a *App) GetLoadingStage() string {
	// HTTP client doesn't provide stage tracking
	return ""
}

// GetLoadedModelName returns the name of the currently loaded model
// This is a Wails binding that can be called from the frontend
func (a *App) GetLoadedModelName() string {
	if a.httpClient == nil {
		return "No model loaded"
	}

	info, err := a.httpClient.GetLoadedModel()
	if err != nil || info == nil {
		return "No model loaded"
	}

	if data, ok := info["data"].([]interface{}); ok && len(data) > 0 {
		if m, ok := data[0].(map[string]interface{}); ok {
			if id, ok := m["id"].(string); ok {
				return filepath.Base(id)
			}
		}
	}
	return "No model loaded"
}

// GetChatMessages returns all messages in the current chat context
// This is a Wails binding that can be called from the frontend
func (a *App) GetChatMessages() []map[string]interface{} {
	return a.chatMessages
}

// ClearChat clears the current chat context
// This is a Wails binding that can be called from the frontend
func (a *App) ClearChat() error {
	a.chatMessages = []map[string]interface{}{}
	a.triggeredLore = map[string]bool{}
	return nil
}

// GetSamplerSettings returns the current sampler settings
// This is a Wails binding that can be called from the frontend
func (a *App) GetSamplerSettings() map[string]interface{} {
	if a.samplerSettings == nil {
		return map[string]interface{}{}
	}
	return a.samplerSettings
}

// SetSamplerSettings updates the sampler settings
// This is a Wails binding that can be called from the frontend
func (a *App) SetSamplerSettings(settings map[string]interface{}) error {
	a.samplerSettings = settings
	return nil
}

// SetModelOptions updates the model loading options
// This is a Wails binding that can be called from the frontend
func (a *App) SetModelOptions(options map[string]interface{}) error {
	// Store options for future use (llama-server handles most of these)
	// Merge with existing settings to preserve unset values
	if a.modelSettings == nil {
		a.modelSettings = make(map[string]interface{})
	}
	for k, v := range options {
		a.modelSettings[k] = v
	}
	return nil
}

// GetModelOptions returns the current model options
// This is a Wails binding that can be called from the frontend
func (a *App) GetModelOptions() map[string]interface{} {
	if a.modelSettings == nil {
		return map[string]interface{}{}
	}
	return a.modelSettings
}

// GetModelsDir returns the absolute path to the models directory
// This is a Wails binding that can be called from the frontend
func (a *App) GetModelsDir() string {
	cwd, _ := os.Getwd()
	modelsDir := filepath.Join(cwd, "models")
	if _, err := os.Stat(modelsDir); err != nil {
		exeDir := filepath.Dir(os.Args[0])
		modelsDir = filepath.Join(exeDir, "models")
	}
	_ = os.MkdirAll(modelsDir, 0755)
	return modelsDir
}

// OpenModelFilePicker opens a native file dialog and returns the selected model path
// This is a Wails binding that can be called from the frontend
func (a *App) OpenModelFilePicker() (string, error) {
	modelsDir := a.GetModelsDir()
	path, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title:            "Select Model File",
		DefaultDirectory: modelsDir,
		Filters: []runtime.FileFilter{
			{DisplayName: "GGUF Models (*.gguf)", Pattern: "*.gguf"},
			{DisplayName: "All Model Files (*.gguf;*.bin)", Pattern: "*.gguf;*.bin"},
		},
	})
	if err != nil {
		return "", fmt.Errorf("file dialog error: %w", err)
	}
	return path, nil
}

// OpenImageModelsDirPicker opens a directory dialog for selecting the image models directory
func (a *App) OpenImageModelsDirPicker() (string, error) {
	modelsDir := a.GetModelsDir()
	dir, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title:            "Select Image Models Directory",
		DefaultDirectory: modelsDir,
	})
	if err != nil {
		return "", fmt.Errorf("directory dialog error: %w", err)
	}
	return dir, nil
}

// OpenSDServerFilePicker opens a file dialog for selecting the sd-server binary
func (a *App) OpenSDServerFilePicker() (string, error) {
	exeDir := filepath.Dir(os.Args[0])
	path, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title:            "Select sd-server Binary",
		DefaultDirectory: exeDir,
		Filters: []runtime.FileFilter{
			{DisplayName: "Executable (*.exe)", Pattern: "*.exe"},
			{DisplayName: "All Files", Pattern: "*"},
		},
	})
	if err != nil {
		return "", fmt.Errorf("file dialog error: %w", err)
	}
	return path, nil
}

// LoadModelMetadata reads GGUF metadata from a model file and returns a ModelProfile
// This is a Wails binding that can be called from the frontend
func (a *App) LoadModelMetadata(path string) (*types.ModelProfile, error) {
	reader := gguf.NewReader()
	profile, err := reader.ReadProfile(path)
	if err != nil {
		return nil, err
	}
	return profile, nil
}

// UpdateRuntimeSettings updates the runtime settings for model loading
// This is a Wails binding that can be called from the frontend
func (a *App) UpdateRuntimeSettings(settings *types.RuntimeSettings) error {
	// Store settings for future use (llama-server handles most of these)
	// Convert to map for storage
	a.modelSettings = map[string]interface{}{
		"threads":         settings.Threads,
		"batch_size":      settings.BatchSize,
		"context_size":    settings.ContextSize,
		"gpu_layers":      settings.GPULayers,
		"rope_mode":       settings.RopeMode,
		"rope_factor":     settings.RopeFactor,
		"rope_base":       settings.RopeBase,
		"flash_attention": settings.FlashAttention,
		"tensor_split":    settings.TensorSplit,
		"main_gpu":        settings.MainGPU,
		"offload_kqv":     settings.OffloadKQV,
		"use_mmap":        settings.UseMMap,
		"use_mlock":       settings.UseMLock,
		"vocab_only":      settings.VocabOnly,
	}
	return nil
}

// UpdatePromptSettings updates the prompt settings for the prompt pipeline
// This is a Wails binding that can be called from the frontend
func (a *App) UpdatePromptSettings(settings *types.PromptSettings) error {
	// Store prompt settings for the prompt pipeline
	// Convert to map for storage
	if a.modelSettings == nil {
		a.modelSettings = make(map[string]interface{})
	}

	a.modelSettings["prompt_template"] = settings.PromptTemplate
	a.modelSettings["custom_jinja_template"] = settings.CustomJinjaTemplate
	a.modelSettings["system_prompt_override"] = settings.SystemPromptOverride
	a.modelSettings["user_prefix"] = settings.UserPrefix
	a.modelSettings["assistant_prefix"] = settings.AssistantPrefix
	a.modelSettings["stop_sequences"] = settings.StopSequences

	return nil
}

// LoadChatData loads current chat session data
// This is a Wails binding that can be called from frontend
func (a *App) LoadChatData() (map[string]interface{}, error) {
	// Return current backend state if available
	if a.world != nil || a.scenario != nil || len(a.characters) > 0 || len(a.lorebooks) > 0 {
		worldMap := map[string]interface{}(nil)
		if a.world != nil {
			imagePath := ""
			if a.world.Image != nil {
				imagePath = a.world.Image.Path
			}
			worldMap = map[string]interface{}{
				"id":          a.world.ID,
				"name":        a.world.Name,
				"description": a.world.Description,
				"image":       imagePath,
			}
		}

		scenarioMap := map[string]interface{}(nil)
		if a.scenario != nil {
			imagePath := ""
			if a.scenario.Image != nil {
				imagePath = a.scenario.Image.Path
			}
			scenarioMap = map[string]interface{}{
				"id":          a.scenario.ID,
				"name":        a.scenario.Name,
				"description": a.scenario.Description,
				"image":       imagePath,
			}
		}

		charactersSlice := make([]map[string]interface{}, len(a.characters))
		for i, char := range a.characters {
			imagePath := ""
			if char.Image != nil {
				imagePath = char.Image.Path
			}
			charactersSlice[i] = map[string]interface{}{
				"id":          char.ID,
				"name":        char.Name,
				"personality": char.Personality,
				"backstory":   char.Backstory,
				"image":       imagePath,
			}
		}

		lorebooksInterface := make([]interface{}, len(a.lorebooks))
		for i, lb := range a.lorebooks {
			lorebooksInterface[i] = map[string]interface{}{
				"id":                lb.ID,
				"name":              lb.Name,
				"title":             lb.Title,
				"description":       lb.Description,
				"content":           lb.Content,
				"tags":              lb.Tags,
				"scope":             lb.Scope,
				"type":              lb.Type,
				"ownerId":           lb.OwnerID,
				"enabled":           lb.Enabled,
				"triggerPhrases":    lb.TriggerPhrases,
				"secondaryTriggers": lb.SecondaryTriggers,
				"triggerMode":       lb.TriggerMode,
				"triggerDirection":  lb.TriggerDirection,
				"triggerFrequency":  lb.TriggerFrequency,
				"priorityLevel":     lb.PriorityLevel,
				"maxLength":         lb.MaxLength,
				"contextBudget":     lb.ContextBudget,
				"scanWindow":        lb.ScanWindow,
				"automated":         lb.Automated,
			}
		}
		return map[string]interface{}{
			"characters": charactersSlice,
			"world":      worldMap,
			"scenario":   scenarioMap,
			"lorebooks":  lorebooksInterface,
			"chatName":   "New Chat",
		}, nil
	}

	// Try to load from localStorage first
	if data, err := a.loadChatDataFromStorage(); err == nil && data != nil {
		a.applyChatDataToState(data)
		return data, nil
	}

	// Return empty state if no data found
	return map[string]interface{}{
		"characters": []interface{}{},
		"world":      nil,
		"scenario":   nil,
		"lorebooks":  []interface{}{},
		"chatName":   "New Chat",
	}, nil
}

// SaveChatData persists chat session data
// This is a Wails binding that can be called from frontend
func (a *App) SaveChatData(data map[string]interface{}) error {
	// Keep the backend state in sync with the frontend chat state.
	a.applyChatDataToState(data)

	// Convert frontend data to ChatData structure
	chatData, err := a.convertFrontendDataToChatData(data)
	if err != nil {
		return fmt.Errorf("failed to convert frontend data: %w", err)
	}

	if a.chatPersistence == nil {
		return nil
	}

	// Save to file system with proper persistence
	return a.chatPersistence.SaveChat(chatData)
}

// convertFrontendDataToChatData converts frontend data map to ChatData struct
func (a *App) convertFrontendDataToChatData(data map[string]interface{}) (*chat.ChatData, error) {
	chatData := &chat.ChatData{}

	// Parse meta data
	if meta, ok := data["meta"].(map[string]interface{}); ok {
		chatData.Meta = chat.ChatMeta{
			ID:             a.getStringFromMap(meta, "id"),
			Name:           a.getStringFromMap(meta, "name"),
			CreatedAt:      a.getStringFromMap(meta, "createdAt"),
			UpdatedAt:      a.getStringFromMap(meta, "updatedAt"),
			WorldName:      a.getStringFromMap(meta, "worldName"),
			ScenarioName:   a.getStringFromMap(meta, "scenarioName"),
			CharacterNames: a.getStringSliceFromMap(meta, "characterNames"),
			LorebookNames:  a.getStringSliceFromMap(meta, "lorebookNames"),
		}
	}

	// Parse history
	if historyData, ok := data["history"].([]interface{}); ok {
		chatData.History = make([]chat.ChatHistory, 0, len(historyData))
		for _, histItem := range historyData {
			if histMap, ok := histItem.(map[string]interface{}); ok {
				chatData.History = append(chatData.History, chat.ChatHistory{
					ID:        a.getStringFromMap(histMap, "id"),
					Sender:    a.getStringFromMap(histMap, "sender"),
					Text:      a.getStringFromMap(histMap, "text"),
					Role:      a.getStringFromMap(histMap, "role"),
					Timestamp: a.getStringFromMap(histMap, "timestamp"),
					HasImage:  a.getBoolFromMap(histMap, "hasImage"),
				})
			}
		}
	}

	// Parse world data
	if worldDataMap, ok := data["world"].(map[string]interface{}); ok && worldDataMap != nil {
		world, err := a.parseWorldContextFromMap(worldDataMap)
		if err != nil {
			return nil, fmt.Errorf("failed to parse world data: %w", err)
		}
		chatData.World = &world
	}

	// Parse scenario data
	if scenarioDataMap, ok := data["scenario"].(map[string]interface{}); ok && scenarioDataMap != nil {
		scenario, err := a.parseScenarioContextFromMap(scenarioDataMap)
		if err != nil {
			return nil, fmt.Errorf("failed to parse scenario data: %w", err)
		}
		chatData.Scenario = &scenario
	}

	// Parse characters data
	if charactersDataSlice, ok := data["characters"].([]interface{}); ok {
		var characters []*chat.CharacterContext
		for _, charItem := range charactersDataSlice {
			if charMap, ok := charItem.(map[string]interface{}); ok {
				character, err := a.parseCharacterContextFromMap(charMap)
				if err != nil {
					return nil, fmt.Errorf("failed to parse character data: %w", err)
				}
				characters = append(characters, &character)
			}
		}
		chatData.Characters = characters
	}

	// Parse lorebooks data
	if lorebooksData, ok := data["lorebooks"].([]interface{}); ok {
		chatData.Lorebooks = lorebooksData
	}

	// Parse memories data
	if memoriesData, ok := data["memories"].([]interface{}); ok {
		chatData.Memories = memoriesData
	}

	// Ensure we have a valid ID
	if chatData.Meta.ID == "" {
		chatData.Meta.ID = fmt.Sprintf("%d", time.Now().Unix())
	}

	return chatData, nil
}

// Helper methods for safe map extraction
func (a *App) getStringFromMap(m map[string]interface{}, key string) string {
	if val, ok := m[key]; ok {
		if str, ok := val.(string); ok {
			return str
		}
	}
	return ""
}

func (a *App) getIntFromMap(m map[string]interface{}, key string) int {
	if val, ok := m[key]; ok {
		if i, ok := val.(float64); ok {
			return int(i)
		}
		if i, ok := val.(int); ok {
			return i
		}
	}
	return 0
}

func (a *App) getBoolFromMap(m map[string]interface{}, key string) bool {
	if val, ok := m[key]; ok {
		if b, ok := val.(bool); ok {
			return b
		}
	}
	return false
}

func (a *App) getStringSliceFromMap(m map[string]interface{}, key string) []string {
	if val, ok := m[key]; ok {
		if slice, ok := val.([]interface{}); ok {
			result := make([]string, 0, len(slice))
			for _, item := range slice {
				if str, ok := item.(string); ok {
					result = append(result, str)
				}
			}
			return result
		}
	}
	return []string{}
}

func (a *App) parseImageFromValue(imageVal interface{}) *chat.Image {
	return chat.ParseImageFromValue(imageVal)
}

func (a *App) parseWorldContextFromMap(worldMap map[string]interface{}) (chat.WorldContext, error) {
	return chat.ParseWorldContextFromMap(worldMap)
}

func (a *App) parseScenarioContextFromMap(scenarioMap map[string]interface{}) (chat.ScenarioContext, error) {
	return chat.ParseScenarioContextFromMap(scenarioMap)
}

func (a *App) parseCharacterContextFromMap(characterMap map[string]interface{}) (chat.CharacterContext, error) {
	return chat.ParseCharacterContextFromMap(characterMap)
}

// OpenCharacterSheet opens character management interface
// This is a Wails binding that can be called from frontend
func (a *App) OpenCharacterSheet(characterId string) error {
	// Navigate within the app window to the character editor with the character ID
	runtime.WindowExecJS(a.ctx, fmt.Sprintf("window.location.href='character.html?id=%s'", characterId))
	return nil
}

// AddCharacterToChat adds a character to the current chat session
// This is a Wails binding that can be called from frontend
func (a *App) AddCharacterToChat(character map[string]interface{}) error {
	parsed, err := a.parseCharacterContextFromMap(character)
	if err != nil {
		return fmt.Errorf("AddCharacterToChat: failed to parse character: %w", err)
	}

	// Merge into a.characters by ID — replace existing entry or append
	found := false
	for i, c := range a.characters {
		if c.ID == parsed.ID {
			a.characters[i] = &parsed
			found = true
			break
		}
	}
	if !found {
		a.characters = append(a.characters, &parsed)
	}

	return nil
}

// ResetSessionCharacters clears the in-memory character list for the current session.
// Call this before re-syncing characters on a chat switch so stale entries are removed.
func (a *App) ResetSessionCharacters() error {
	a.characters = []*chat.CharacterContext{}
	return nil
}

// CreateCharacter creates a new character and returns it
// This is a Wails binding for character creation
func (a *App) CreateCharacter(character map[string]interface{}) (map[string]interface{}, error) {
	// Generate a unique ID for the character
	character["id"] = fmt.Sprintf("char_%d", time.Now().Unix())

	// Load existing characters
	data, err := a.loadChatDataFromStorage()
	if err != nil {
		data = map[string]interface{}{
			"characters": []interface{}{},
			"world":      nil,
			"scenario":   nil,
			"lorebooks":  []interface{}{},
			"chatName":   "New Chat",
		}
	}

	// Add the new character to the characters array
	characters, ok := data["characters"].([]interface{})
	if !ok {
		characters = []interface{}{}
	}
	characters = append(characters, character)
	data["characters"] = characters

	// Save updated data and return the character
	err = a.saveChatDataToStorage(data)
	if err != nil {
		return nil, err
	}

	return character, nil
}

// GetCharacters loads all characters from the Characters directory
// This is a Wails binding that can be called from the frontend
func (a *App) GetCharacters() ([]map[string]interface{}, error) {
	var characters []map[string]interface{}

	// Get the characters directory
	cwd, _ := os.Getwd()
	charactersDir := filepath.Join(cwd, "Characters")
	if _, err := os.Stat(charactersDir); err != nil {
		exeDir := filepath.Dir(os.Args[0])
		charactersDir = filepath.Join(exeDir, "Characters")
	}

	// Create directory if it doesn't exist
	_ = os.MkdirAll(charactersDir, 0755)

	// Read all subdirectories (each is a character)
	entries, err := os.ReadDir(charactersDir)
	if err != nil {
		return characters, fmt.Errorf("failed to read characters directory: %w", err)
	}

	for _, entry := range entries {
		if !entry.IsDir() {
			continue // Skip files, only process directories
		}

		charName := entry.Name()
		charPath := filepath.Join(charactersDir, charName, "character.json")

		// Read character.json
		data, err := os.ReadFile(charPath)
		if err != nil {
			// Skip if character.json doesn't exist
			continue
		}

		// If file is empty, create a minimal character entry
		if len(data) == 0 || string(data) == "{}" {
			charData := map[string]interface{}{
				"id":   charName,
				"name": charName,
				"howl": map[string]interface{}{},
			}
			characters = append(characters, charData)
			continue
		}

		// Parse character data
		var charData map[string]interface{}
		if err := json.Unmarshal(data, &charData); err != nil {
			// If JSON parsing fails, create a minimal entry
			charData = map[string]interface{}{
				"id":   charName,
				"name": charName,
				"howl": map[string]interface{}{},
			}
		}

		// Ensure the character has a name and ID
		if _, hasName := charData["name"]; !hasName {
			charData["name"] = charName
		}
		if _, hasID := charData["id"]; !hasID {
			charData["id"] = charName
		}

		characters = append(characters, charData)
	}

	return characters, nil
}

// AddWorldToChat adds a world to the current chat session
// This is a Wails binding that can be called from frontend
func (a *App) AddWorldToChat(worldMap map[string]interface{}) error {
	world, err := a.parseWorldContextFromMap(worldMap)
	if err != nil {
		return fmt.Errorf("AddWorldToChat: failed to parse world: %w", err)
	}

	a.world = &world

	// Persist immediately so SaveChat picks it up
	if a.chatPersistence != nil {
		if chatID := a.chatPersistence.GetLastChatID(); chatID != "" {
			_ = a.performSave()
		}
	}

	return nil
}

// AddScenarioToChat adds a scenario to the current chat session
// This is a Wails binding that can be called from frontend
func (a *App) AddScenarioToChat(scenario map[string]interface{}) error {
	parsed, err := a.parseScenarioContextFromMap(scenario)
	if err != nil {
		return fmt.Errorf("AddScenarioToChat: failed to parse scenario: %w", err)
	}

	a.scenario = &parsed

	// Persist immediately so SaveChat picks it up
	if a.chatPersistence != nil {
		if chatID := a.chatPersistence.GetLastChatID(); chatID != "" {
			_ = a.performSave()
		}
	}

	return nil
}

// Helper methods for localStorage operations
func (a *App) loadChatDataFromStorage() (map[string]interface{}, error) {
	// For now, return empty data since localStorage access from Go is complex
	// The frontend handles localStorage directly
	return map[string]interface{}{
		"characters": []interface{}{},
		"world":      nil,
		"scenario":   nil,
		"lorebooks":  []interface{}{},
		"chatName":   "New Chat",
	}, nil
}

func (a *App) saveChatDataToStorage(data map[string]interface{}) error {
	// The frontend handles localStorage directly via saveChatData() function
	// This function is kept for compatibility but the actual saving is done client-side
	fmt.Printf("Chat data save requested: %+v\n", data)
	return nil
}

// syncAppStateFromChatService updates the App's state from the chat.Service's state
func (a *App) syncAppStateFromChatService() {
	a.world = a.chatService.GetWorldData()
	a.scenario = a.chatService.GetScenarioData()
	a.characters = a.chatService.GetCharacterData()
	a.lorebooks = a.chatService.GetAllLorebookEntries()
}

// applyChatDataToState keeps the backend state in sync with the frontend chat state
func (a *App) applyChatDataToState(data map[string]interface{}) {
	// Update world
	if worldMap, ok := data["world"].(map[string]interface{}); ok && worldMap != nil {
		world, err := a.parseWorldContextFromMap(worldMap)
		if err != nil {
			fmt.Printf("Error parsing world data: %v\n", err)
			a.world = nil
		} else {
			a.world = &world
		}
	} else {
		a.world = nil
	}

	// Update scenario
	if scenarioMap, ok := data["scenario"].(map[string]interface{}); ok && scenarioMap != nil {
		scenario, err := a.parseScenarioContextFromMap(scenarioMap)
		if err != nil {
			fmt.Printf("Error parsing scenario data: %v\n", err)
			a.scenario = nil
		} else {
			a.scenario = &scenario
		}
	} else {
		a.scenario = nil
	}

	// Update characters
	if charsSlice, ok := data["characters"].([]interface{}); ok {
		var characters []*chat.CharacterContext
		for _, charItem := range charsSlice {
			if charMap, ok := charItem.(map[string]interface{}); ok {
				character, err := a.parseCharacterContextFromMap(charMap)
				if err != nil {
					fmt.Printf("Error parsing character data: %v\n", err)
					continue
				}
				characters = append(characters, &character)
			}
		}
		a.characters = characters
	} else {
		a.characters = []*chat.CharacterContext{}
	}

	// Update lorebooks — use full parser so trigger phrases, scope, enabled, etc. survive.
	if lorebooks, ok := data["lorebooks"].([]interface{}); ok {
		a.lorebooks = make([]lorebook.Entry, 0, len(lorebooks))
		for _, l := range lorebooks {
			if lorebookMap, ok := l.(map[string]interface{}); ok {
				entry, err := lorebook.ParseLorebookEntryFromMap(lorebookMap)
				if err != nil {
					fmt.Printf("Error parsing lorebook entry: %v\n", err)
					continue
				}
				a.lorebooks = append(a.lorebooks, entry)
			}
		}
	} else {
		a.lorebooks = []lorebook.Entry{}
	}

	// Update chat name if provided
	if chatName, ok := data["chatName"].(string); ok {
		// Store chat name for reference
		_ = chatName
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// ==================== MEMORY MANAGEMENT WAILS BINDINGS ====================

// MemoryFilter defines filtering options for memory queries
type MemoryFilter struct {
	Query  string `json:"query,omitempty"`
	Scope  string `json:"scope,omitempty"`
	Status string `json:"status,omitempty"`
}

// MemoryEdit defines editable fields for memory updates
type MemoryEdit struct {
	Title   string   `json:"title,omitempty"`
	Summary string   `json:"summary,omitempty"`
	Tags    []string `json:"tags,omitempty"`
	Pinned  bool     `json:"pinned,omitempty"`
}

// MemoryRecord represents a complete memory entry with metadata
type MemoryRecord struct {
	ID              string                 `json:"id"`
	CreatedAt       string                 `json:"createdAt"`
	LastTriggeredAt string                 `json:"lastTriggeredAt,omitempty"`
	SourceMessages  []string               `json:"sourceMessages,omitempty"`
	RawText         string                 `json:"rawText,omitempty"`
	Summary         string                 `json:"summary,omitempty"`
	Title           string                 `json:"title"`
	Type            string                 `json:"type"`
	Scope           string                 `json:"scope"`
	ScopeID         string                 `json:"scopeId,omitempty"`
	Confidence      int                    `json:"confidence,omitempty"`
	Status          string                 `json:"status,omitempty"`
	Pinned          bool                   `json:"pinned,omitempty"`
	Tags            []string               `json:"tags,omitempty"`
	Author          string                 `json:"author,omitempty"`
	Trigger         string                 `json:"trigger,omitempty"`
	ScoreBreakdown  map[string]interface{} `json:"scoreBreakdown,omitempty"`
	ResolverVersion int                    `json:"resolverVersion,omitempty"`
	Version         int                    `json:"version,omitempty"`
}

// AutoCaptureConfig defines automatic memory capture settings
type AutoCaptureConfig struct {
	Enabled       bool     `json:"enabled"`
	MinConfidence int      `json:"minConfidence"`
	MaxPerMessage int      `json:"maxPerMessage"`
	TriggerWords  []string `json:"triggerWords,omitempty"`
}

// GetMemories retrieves memories for a chat with optional filtering
// This is a Wails binding that can be called from the frontend
func (a *App) GetMemories(chatID string, filter MemoryFilter) ([]MemoryRecord, error) {
	if a.memoryService == nil {
		return nil, fmt.Errorf("memory service not initialized")
	}
	if chatID != "" {
		a.memoryService.SetChatID(chatID)
	}

	// Convert filter to types.MemoryFilter
	typesFilter := types.MemoryFilter{
		Query:  filter.Query,
		Scope:  filter.Scope,
		Status: filter.Status,
	}

	// Get memories from service
	typesMemories, err := a.memoryService.GetMemories(typesFilter)
	if err != nil {
		return nil, err
	}

	// Convert types.MemoryRecord to app.MemoryRecord
	var memories []MemoryRecord
	for _, tm := range typesMemories {
		mem := MemoryRecord{
			ID:              tm.ID,
			CreatedAt:       tm.CreatedAt,
			LastTriggeredAt: tm.UpdatedAt,
			SourceMessages:  []string{},
			RawText:         tm.Content,
			Summary:         tm.Summary,
			Title:           tm.Title,
			Type:            "automated",
			Scope:           tm.Scope,
			ScopeID:         tm.OwnerID,
			Confidence:      int(tm.Confidence),
			Status:          tm.Status,
			Pinned:          tm.Pinned,
			Tags:            tm.Tags,
			Author:          "system",
			Trigger:         tm.Source,
			ScoreBreakdown:  map[string]interface{}{},
			ResolverVersion: 1,
			Version:         1,
		}
		memories = append(memories, mem)
	}

	return memories, nil
}

// GetMemoryDetail retrieves detailed information about a specific memory
// This is a Wails binding that can be called from frontend
func (a *App) GetMemoryDetail(chatID string, memoryID string) (*MemoryRecord, error) {
	if a.memoryService == nil {
		return nil, fmt.Errorf("memory service not initialized")
	}
	if chatID != "" {
		a.memoryService.SetChatID(chatID)
	}

	tm, err := a.memoryService.GetMemoryDetail(memoryID)
	if err != nil {
		return nil, err
	}

	// Convert types.MemoryRecord to app.MemoryRecord
	mem := MemoryRecord{
		ID:              tm.ID,
		CreatedAt:       tm.CreatedAt,
		LastTriggeredAt: tm.UpdatedAt,
		SourceMessages:  []string{},
		RawText:         tm.Content,
		Summary:         tm.Summary,
		Title:           tm.Title,
		Type:            "automated",
		Scope:           tm.Scope,
		ScopeID:         tm.OwnerID,
		Confidence:      int(tm.Confidence),
		Status:          tm.Status,
		Pinned:          tm.Pinned,
		Tags:            tm.Tags,
		Author:          "system",
		Trigger:         tm.Source,
		ScoreBreakdown:  map[string]interface{}{},
		ResolverVersion: 1,
		Version:         1,
	}

	return &mem, nil
}

// EditMemory updates an existing memory with new values
// This is a Wails binding that can be called from frontend
func (a *App) EditMemory(chatID string, memoryID string, edits MemoryEdit) (*MemoryRecord, error) {
	if a.memoryService == nil {
		return nil, fmt.Errorf("memory service not initialized")
	}
	if chatID != "" {
		a.memoryService.SetChatID(chatID)
	}

	// Convert app.MemoryEdit to types.MemoryEdit
	typesEdits := types.MemoryEdit{
		Title:   edits.Title,
		Summary: edits.Summary,
		Tags:    edits.Tags,
		Pinned:  edits.Pinned,
	}

	tm, err := a.memoryService.EditMemory(memoryID, typesEdits)
	if err != nil {
		return nil, err
	}

	// Convert types.MemoryRecord to app.MemoryRecord
	mem := MemoryRecord{
		ID:              tm.ID,
		CreatedAt:       tm.CreatedAt,
		LastTriggeredAt: tm.UpdatedAt,
		SourceMessages:  []string{},
		RawText:         tm.Content,
		Summary:         tm.Summary,
		Title:           tm.Title,
		Type:            "automated",
		Scope:           tm.Scope,
		ScopeID:         tm.OwnerID,
		Confidence:      int(tm.Confidence),
		Status:          tm.Status,
		Pinned:          tm.Pinned,
		Tags:            tm.Tags,
		Author:          "system",
		Trigger:         tm.Source,
		ScoreBreakdown:  map[string]interface{}{},
		ResolverVersion: 1,
		Version:         1,
	}

	return &mem, nil
}

// AddMemory creates a new memory record in the chat session
// This is a Wails binding that can be called from frontend
func (a *App) AddMemory(chatID string, record MemoryRecord) (*MemoryRecord, error) {
	if a.memoryService == nil {
		return nil, fmt.Errorf("memory service not initialized")
	}
	if chatID != "" {
		a.memoryService.SetChatID(chatID)
	}

	// Convert app.MemoryRecord to types.MemoryRecord
	typesRecord := types.MemoryRecord{
		ID:         record.ID,
		Title:      record.Title,
		Summary:    record.Summary,
		Content:    record.RawText,
		Scope:      record.Scope,
		OwnerID:    record.ScopeID,
		Tags:       record.Tags,
		Pinned:     record.Pinned,
		Status:     record.Status,
		Confidence: float64(record.Confidence),
		Source:     record.Trigger,
		CreatedAt:  record.CreatedAt,
		UpdatedAt:  record.LastTriggeredAt,
	}

	tm, err := a.memoryService.AddMemory(typesRecord)
	if err != nil {
		return nil, err
	}

	// Convert types.MemoryRecord back to app.MemoryRecord
	mem := MemoryRecord{
		ID:              tm.ID,
		CreatedAt:       tm.CreatedAt,
		LastTriggeredAt: tm.UpdatedAt,
		SourceMessages:  []string{},
		RawText:         tm.Content,
		Summary:         tm.Summary,
		Title:           tm.Title,
		Type:            "automated",
		Scope:           tm.Scope,
		ScopeID:         tm.OwnerID,
		Confidence:      int(tm.Confidence),
		Status:          tm.Status,
		Pinned:          tm.Pinned,
		Tags:            tm.Tags,
		Author:          "system",
		Trigger:         tm.Source,
		ScoreBreakdown:  map[string]interface{}{},
		ResolverVersion: 1,
		Version:         1,
	}

	return &mem, nil
}

// PinMemory toggles pinned status of a memory
// This is a Wails binding that can be called from frontend
func (a *App) PinMemory(chatID string, memoryID string, pinned bool) error {
	if a.memoryService == nil {
		return fmt.Errorf("memory service not initialized")
	}
	if chatID != "" {
		a.memoryService.SetChatID(chatID)
	}
	return a.memoryService.PinMemory(memoryID, pinned)
}

// DeleteMemory removes a memory from the chat session
// This is a Wails binding that can be called from the frontend
func (a *App) DeleteMemory(chatID string, memoryID string) error {
	if a.memoryService == nil {
		return fmt.Errorf("memory service not initialized")
	}
	if chatID != "" {
		a.memoryService.SetChatID(chatID)
	}
	return a.memoryService.DeleteMemory(memoryID)
}

// ExportMemories exports memories with optional filtering
// This is a Wails binding that can be called from frontend
func (a *App) ExportMemories(chatID string, filter MemoryFilter) ([]MemoryRecord, error) {
	if a.memoryService == nil {
		return nil, fmt.Errorf("memory service not initialized")
	}
	if chatID != "" {
		a.memoryService.SetChatID(chatID)
	}

	// Convert filter to types.MemoryFilter
	typesFilter := types.MemoryFilter{
		Query:  filter.Query,
		Scope:  filter.Scope,
		Status: filter.Status,
	}

	// Get memories from service
	typesMemories, err := a.memoryService.ExportMemories(typesFilter)
	if err != nil {
		return nil, err
	}

	// Convert types.MemoryRecord to app.MemoryRecord
	var memories []MemoryRecord
	for _, tm := range typesMemories {
		mem := MemoryRecord{
			ID:              tm.ID,
			CreatedAt:       tm.CreatedAt,
			LastTriggeredAt: tm.UpdatedAt,
			SourceMessages:  []string{},
			RawText:         tm.Content,
			Summary:         tm.Summary,
			Title:           tm.Title,
			Type:            "automated",
			Scope:           tm.Scope,
			ScopeID:         tm.OwnerID,
			Confidence:      int(tm.Confidence),
			Status:          tm.Status,
			Pinned:          tm.Pinned,
			Tags:            tm.Tags,
			Author:          "system",
			Trigger:         tm.Source,
			ScoreBreakdown:  map[string]interface{}{},
			ResolverVersion: 1,
			Version:         1,
		}
		memories = append(memories, mem)
	}

	return memories, nil
}

// GetAutoCaptureConfig retrieves automatic memory capture settings
// This is a Wails binding that can be called from frontend
func (a *App) GetAutoCaptureConfig(chatID string) (*AutoCaptureConfig, error) {
	if a.memoryService == nil {
		return nil, fmt.Errorf("memory service not initialized")
	}
	if chatID != "" {
		a.memoryService.SetChatID(chatID)
	}

	typesConfig, err := a.memoryService.GetAutoCaptureConfig()
	if err != nil {
		return nil, err
	}

	// Convert types.AutoCaptureConfig to app.AutoCaptureConfig
	config := AutoCaptureConfig{
		Enabled:       typesConfig.Enabled,
		MinConfidence: int(typesConfig.MinConfidence),
		MaxPerMessage: typesConfig.MaxPerMessage,
		TriggerWords:  typesConfig.TriggerWords,
	}

	return &config, nil
}

// SetAutoCaptureConfig updates automatic memory capture settings
// This is a Wails binding that can be called from frontend
func (a *App) SetAutoCaptureConfig(chatID string, config AutoCaptureConfig) error {
	if a.memoryService == nil {
		return fmt.Errorf("memory service not initialized")
	}
	if chatID != "" {
		a.memoryService.SetChatID(chatID)
	}

	// Convert app.AutoCaptureConfig to types.AutoCaptureConfig
	typesConfig := types.AutoCaptureConfig{
		Enabled:       config.Enabled,
		MinConfidence: float64(config.MinConfidence),
		MaxPerMessage: config.MaxPerMessage,
		TriggerWords:  config.TriggerWords,
	}

	return a.memoryService.SetAutoCaptureConfig(typesConfig)
}

// ---------------------------------------------------------------------------
// Audio Wails Bindings
// ---------------------------------------------------------------------------

// TranscribeAudio runs speech recognition on an audio file and returns the transcript.
func (a *App) TranscribeAudio(audioPath string) (string, error) {
	if a.audioPipeline == nil {
		return "", fmt.Errorf("audio pipeline not initialized")
	}
	result, err := a.audioPipeline.ProcessAudioMessage(context.Background(), audiotypes.AudioMessage{
		Type:      "audio_input",
		AudioPath: audioPath,
	})
	if err != nil {
		return "", err
	}
	return result.TranscribedText, nil
}

// SynthesizeSpeech converts text to speech and returns the path to the generated audio file.
func (a *App) SynthesizeSpeech(text string) (string, error) {
	if a.audioPipeline == nil {
		return "", fmt.Errorf("audio pipeline not initialized")
	}
	result, err := a.audioPipeline.ProcessAudioMessage(context.Background(), audiotypes.AudioMessage{
		Type: "audio_output",
		Text: text,
	})
	if err != nil {
		return "", err
	}
	return result.AudioOutputPath, nil
}

// SynthesizeSpeechWithVoice converts text to speech using a per-request voice override.
func (a *App) SynthesizeSpeechWithVoice(text string, voiceJSON string) (string, error) {
	if a.audioPipeline == nil {
		return "", fmt.Errorf("audio pipeline not initialized")
	}
	var override audiotypes.VoiceOverride
	if voiceJSON != "" {
		if err := json.Unmarshal([]byte(voiceJSON), &override); err != nil {
			fmt.Printf("WARN: failed to parse voice override JSON (%v), falling back to default voice\n", err)
		}
	}
	msg := audiotypes.AudioMessage{
		Type: "audio_output",
		Text: text,
	}
	if override.Voice != "" || override.Engine != "" {
		msg.VoiceOverride = &override
	}
	result, err := a.audioPipeline.ProcessAudioMessage(context.Background(), msg)
	if err != nil {
		return "", err
	}
	return result.AudioOutputPath, nil
}

// GetAudioStatus returns the current audio pipeline readiness.
func (a *App) GetAudioStatus() map[string]interface{} {
	if a.audioPipeline == nil {
		return map[string]interface{}{
			"asr_ready":        false,
			"tts_ready":        false,
			"multimodal_ready": false,
			"realtime_ready":   false,
			"active":           false,
		}
	}
	status := a.audioPipeline.GetStatus()
	return map[string]interface{}{
		"asr_ready":        status.ASRReady,
		"tts_ready":        status.TTSReady,
		"multimodal_ready": status.MultimodalReady,
		"realtime_ready":   status.RealtimeReady,
		"active_sessions":  status.ActiveSessions,
		"error_count":      status.ErrorCount,
		"active":           true,
	}
}

// GetTTSAvailableVoices returns the list of available voice names from the current TTS engine.
func (a *App) GetTTSAvailableVoices() []string {
	if a.audioPipeline == nil {
		return nil
	}
	voices := a.audioPipeline.GetTTSVoices()
	result := make([]string, 0, len(voices))
	for _, v := range voices {
		result = append(result, v.ID)
	}
	return result
}

// EnableAudioASR toggles the ASR recognizer on/off.
func (a *App) EnableAudioASR(enabled bool) error {
	if a.audioPipeline == nil {
		return fmt.Errorf("audio pipeline not initialized")
	}
	if enabled {
		// Re-initialize with ASR enabled
		_ = a.audioPipeline.Shutdown(context.Background())
		pipe := audio.NewPipeline()
		cfg := audiotypes.PipelineConfig{
			ASREnabled:        true,
			TTSEnabled:        false,
			MultimodalEnabled: false,
			RealtimeEnabled:   false,
			HardwareTier:      "auto",
		}
		if err := pipe.Initialize(context.Background(), cfg); err != nil {
			return err
		}
		a.audioPipeline = pipe
	} else {
		_ = a.audioPipeline.EnableASR(nil)
	}
	return nil
}

// EnableAudioTTS toggles the TTS synthesizer on/off.
func (a *App) EnableAudioTTS(enabled bool) error {
	if a.audioPipeline == nil {
		return fmt.Errorf("audio pipeline not initialized")
	}
	if enabled {
		// Re-initialize with TTS enabled
		_ = a.audioPipeline.Shutdown(context.Background())
		pipe := audio.NewPipeline()
		cfg := audiotypes.PipelineConfig{
			ASREnabled:        false,
			TTSEnabled:        true,
			MultimodalEnabled: false,
			RealtimeEnabled:   false,
			HardwareTier:      "auto",
		}
		if err := pipe.Initialize(context.Background(), cfg); err != nil {
			return err
		}
		a.audioPipeline = pipe
	} else {
		_ = a.audioPipeline.EnableTTS(nil)
	}
	return nil
}

// ---------------------------------------------------------------------------
// RAG Wails Bindings
// ---------------------------------------------------------------------------

// UploadRAGDocument uploads a document into the RAG knowledge base
func (a *App) UploadRAGDocument(name string, scope string, scopeID string, sourceType string, filePath string) (string, error) {
	if a.ragService == nil {
		return "", fmt.Errorf("RAG service not initialized")
	}

	rawText, err := rag.ExtractTextFromFile(filePath)
	if err != nil {
		return "", err
	}

	doc := &rag.Document{
		Name:       name,
		Scope:      rag.DocumentScope(scope),
		ScopeID:    scopeID,
		SourceType: rag.SourceType(sourceType),
		SourcePath: filePath,
		SizeBytes:  int64(len(rawText)),
		Enabled:    true,
	}

	if err := a.ragService.IngestDocument(doc, rawText); err != nil {
		return "", fmt.Errorf("failed to ingest document: %w", err)
	}

	return doc.ID, nil
}

// ListRAGDocuments returns documents for a given scope
func (a *App) ListRAGDocuments(scope string, scopeID string) ([]rag.Document, error) {
	if a.ragService == nil {
		return nil, fmt.Errorf("RAG service not initialized")
	}
	return a.ragService.ListDocuments(rag.DocumentScope(scope), scopeID)
}

// DeleteRAGDocument removes a document from the RAG knowledge base
func (a *App) DeleteRAGDocument(docID string) error {
	if a.ragService == nil {
		return fmt.Errorf("RAG service not initialized")
	}
	return a.ragService.DeleteDocument(docID)
}

// SetRAGEnabled toggles RAG retrieval for the current chat
func (a *App) SetRAGEnabled(enabled bool) {
	if a.chatService != nil {
		a.chatService.SetRAGEnabled(enabled)
	}
}

// IsRAGEnabled returns whether RAG is currently enabled
func (a *App) IsRAGEnabled() bool {
	if a.chatService == nil {
		return false
	}
	return a.chatService.IsRAGEnabled()
}

// ---------------------------------------------------------------------------
// Image Generation Wails Bindings
// ---------------------------------------------------------------------------

// ListImageModels scans the models directory and returns discovered bundles.
func (a *App) ListImageModels() ([]imagetypes.ModelInfo, error) {
	if a.imageEngine == nil {
		return []imagetypes.ModelInfo{}, fmt.Errorf("image engine not initialized")
	}
	models, err := a.imageEngine.ListModels()
	if err != nil {
		return []imagetypes.ModelInfo{}, err
	}
	if models == nil {
		return []imagetypes.ModelInfo{}, nil
	}
	return models, nil
}

// ListImageLoRAs scans the models directory for LoRA files.
func (a *App) ListImageLoRAs() ([]string, error) {
	if a.imageEngine == nil {
		return []string{}, fmt.Errorf("image engine not initialized")
	}
	loras, err := a.imageEngine.ListLoRAs()
	if err != nil {
		return []string{}, err
	}
	if loras == nil {
		return []string{}, nil
	}
	return loras, nil
}

// SetActiveImageModel loads a model into sd-server.
func (a *App) SetActiveImageModel(name string) (err error) {
	defer func() {
		if r := recover(); r != nil {
			fmt.Printf("[PANIC] SetActiveImageModel: %v\n", r)
			err = fmt.Errorf("internal panic: %v", r)
		}
	}()
	if a.imageEngine == nil {
		return fmt.Errorf("image engine not initialized")
	}
	fmt.Printf("[App] SetActiveImageModel: name=%q engineType=%T\n", name, a.imageEngine)
	return a.imageEngine.LoadModel(name)
}

// UnloadImageModel shuts down the sd-server subprocess and frees model memory.
func (a *App) UnloadImageModel() error {
	if a.imageEngine == nil {
		return fmt.Errorf("image engine not initialized")
	}
	fmt.Printf("[App] UnloadImageModel called\n")
	return a.imageEngine.Shutdown()
}

// StartImageJob queues an async generation job and returns the job ID.
func (a *App) StartImageJob(opts imagetypes.ImageOptions) (string, error) {
	if a.jobManager == nil {
		return "", fmt.Errorf("job manager not initialized")
	}
	id := a.jobManager.Start(opts)
	return id, nil
}

// GetImageJobStatus returns the current status of a job by ID.
func (a *App) GetImageJobStatus(id string) (*imagetypes.ImageJob, error) {
	if a.jobManager == nil {
		return nil, fmt.Errorf("job manager not initialized")
	}
	job := a.jobManager.Status(id)
	if job == nil {
		return nil, fmt.Errorf("job not found: %s", id)
	}
	return job, nil
}

// CancelImageJob marks a job as cancelled.
func (a *App) CancelImageJob(id string) error {
	if a.jobManager == nil {
		return fmt.Errorf("job manager not initialized")
	}
	if !a.jobManager.Cancel(id) {
		return fmt.Errorf("job not found or already finished: %s", id)
	}
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
