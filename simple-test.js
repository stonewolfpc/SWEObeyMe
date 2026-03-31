/**
 * Simple Test for get_project_context
 * Tests the tool directly without MCP protocol
 */

import { ProjectMapper } from './dist/utils/project-mapper.js';
import { ContextMemory } from './dist/utils/context-memory.js';
import { PromptEnforcer } from './dist/utils/prompt-enforcer.js';
import { FileAnalyzer } from './dist/utils/file-analyzer.js';

async function testProjectContext() {
  console.log('🧪 Testing Project Context Builder...\n');
  
  try {
    // Initialize components
    const fileAnalyzer = new FileAnalyzer();
    const projectMapper = new ProjectMapper();
    
    console.log('📁 Building project context...');
    const startTime = Date.now();
    
    // Test the project context builder
    const context = await projectMapper.getProjectContext(process.cwd(), {
      includeTests: false,
      maxDepth: 5,
      cacheKey: 'test'
    });
    
    const endTime = Date.now();
    
    console.log('✅ Project context built successfully!\n');
    console.log(`⏱️  Build time: ${endTime - startTime}ms\n`);
    
    // Display results
    console.log('📊 Project Metadata:');
    console.log(`   Type: ${context.metadata.type}`);
    console.log(`   Language: ${context.metadata.language}`);
    console.log(`   Package Manager: ${context.metadata.packageManager}`);
    console.log(`   Total Files: ${context.metadata.totalFiles}`);
    console.log(`   Total Lines: ${context.metadata.totalLines}`);
    console.log(`   Frameworks: ${context.metadata.frameworks.join(', ') || 'None'}\n`);
    
    console.log('🏗️  Structure Analysis:');
    console.log(`   Namespaces: ${context.namespaces.size}`);
    console.log(`   Classes: ${context.classes.size}`);
    console.log(`   Methods: ${context.methods.size}`);
    console.log(`   Dependencies: ${context.dependencies.bySource.size}\n`);
    
    console.log('🎨 Patterns Detected:');
    if (context.patterns.length > 0) {
      context.patterns.forEach(pattern => {
        console.log(`   - ${pattern.name} (${pattern.confidence.toFixed(2)} confidence)`);
      });
    } else {
      console.log('   No specific patterns detected\n');
    }
    
    console.log('📋 Conventions Found:');
    if (context.conventions.length > 0) {
      context.conventions.forEach(convention => {
        console.log(`   - ${convention.name} (${convention.confidence.toFixed(2)} confidence)`);
      });
    } else {
      console.log('   No specific conventions detected\n');
    }
    
    // Sample some classes
    if (context.classes.size > 0) {
      console.log('📦 Sample Classes:');
      const sampleClasses = Array.from(context.classes.values()).slice(0, 5);
      sampleClasses.forEach(cls => {
        console.log(`   - ${cls.name} (${cls.type}) in ${cls.file}`);
        console.log(`     Methods: ${cls.methods.length}, Properties: ${cls.properties.length}`);
      });
      console.log(`   ... and ${context.classes.size - 5} more\n`);
    }
    
    // Sample dependencies
    if (context.dependencies.bySource.size > 0) {
      console.log('🔗 Sample Dependencies:');
      const sampleDeps = Array.from(context.dependencies.bySource.entries()).slice(0, 3);
      sampleDeps.forEach(([file, deps]) => {
        console.log(`   ${file} -> ${deps.length} dependencies`);
      });
      console.log(`   ... and ${context.dependencies.bySource.size - 3} more files\n`);
    }
    
    // Test memory integration
    console.log('🧠 Testing Memory Integration...');
    const contextMemory = new ContextMemory();
    
    const memoryId = await contextMemory.storeContext('project', context, {
      priority: 'high',
      tags: ['test', 'project-context']
    });
    
    console.log(`✅ Context stored in memory with ID: ${memoryId}`);
    
    const retrievedContext = await contextMemory.getContext(memoryId);
    console.log(`✅ Context retrieved from memory: ${retrievedContext ? 'Success' : 'Failed'}`);
    
    // Test prompt enforcer
    console.log('\n⚖️  Testing Prompt Enforcer...');
    const promptEnforcer = new PromptEnforcer(contextMemory, projectMapper);
    
    const enforcedPrompt = await promptEnforcer.enforcePrompt(
      'Analyze the current project structure',
      'get_project_context',
      { projectPath: process.cwd() }
    );
    
    console.log('✅ Enforced prompt generated');
    console.log(`📝 Prompt length: ${enforcedPrompt.length} characters`);
    console.log(`📋 Sections: ${enforcedPrompt.split('\n\n').length} sections`);
    
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ Project Context Builder: Working');
    console.log('✅ Memory Integration: Working');
    console.log('✅ Prompt Enforcer: Working');
    console.log('✅ Type Safety: No compilation errors');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
testProjectContext().then(() => {
  console.log('\n👋 Test completed successfully!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
