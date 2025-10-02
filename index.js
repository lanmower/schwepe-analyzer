const WorkflowEngine = require('./workflow-engine');
const GrokWorkflows = require('./grok-workflows');
const ConfigManager = require('./config-manager');

class Playflows {
  constructor() {
    this.configManager = new ConfigManager();
    this.engine = null;
    this.grokWorkflows = null;
  }

  async initialize() {
    await this.configManager.loadConfig();

    const config = this.configManager.config;
    this.engine = new WorkflowEngine(config.workflow);
    this.grokWorkflows = new GrokWorkflows(this.engine);

    await this.engine.initialize();
    this.grokWorkflows.defineLoginWorkflow();
    this.grokWorkflows.defineImagineWorkflow();

    console.log('Playflows initialized successfully');
  }

  async setupCredentials(email, password) {
    await this.configManager.setCredentials(email, password);
    console.log('Credentials saved successfully');
  }

  async login() {
    console.log('Preparing login page for manual authentication...');
    await this.grokWorkflows.showLoginPageForManualLogin();
    console.log('Login completed');
  }

  async uploadImage(imagePath) {
    if (!imagePath) {
      throw new Error('Image path is required');
    }

    console.log(`Uploading image: ${imagePath}`);
    await this.grokWorkflows.uploadImageToImagine(imagePath);
    console.log('Image upload completed');
  }

  async uploadAndWaitForDownload(imagePath) {
    if (!imagePath) {
      throw new Error('Image path is required');
    }

    console.log(`Uploading image and waiting for download: ${imagePath}`);
    await this.grokWorkflows.uploadImageToImagine(imagePath);
    console.log('Image upload completed, waiting for generation...');

    const downloadSuccess = await this.grokWorkflows.waitForGenerationAndDownload();

    if (downloadSuccess) {
      console.log('Upload, generation, and download completed successfully');
    } else {
      console.log('Upload and generation completed, but download failed');
    }

    return downloadSuccess;
  }

  async runFullWorkflow(imagePath) {
    try {
      await this.initialize();
      await this.login();
      await this.uploadImage(imagePath);

      this.configManager.config.lastRun = new Date().toISOString();
      await this.configManager.saveConfig();

      console.log('Full workflow completed successfully');
    } catch (error) {
      console.error('Workflow failed:', error.message);
      throw error;
    }
  }

  async close() {
    if (this.engine) {
      await this.engine.close();
    }
  }
}

// Export both the class and individual components
module.exports = {
  Playflows,
  WorkflowEngine,
  GrokWorkflows,
  ConfigManager
};

if (require.main === module) {
  const { Playflows } = require('./index');
  const automation = new Playflows();

  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await automation.close();
    process.exit(0);
  });

  if (process.argv.length > 2) {
    const command = process.argv[2];

    switch (command) {
      case 'login':
        console.log('Starting login process...');
        automation.initialize()
          .then(() => automation.login())
          .then(() => {
            console.log('Login process complete');
            return automation.close();
          })
          .catch(console.error);
        break;

      case 'process':
        if (process.argv.length !== 4) {
          console.log('Usage: playflows process <image-path>');
          process.exit(1);
        }
        automation.initialize()
          .then(() => automation.login())
          .then(() => automation.uploadAndWaitForDownload(process.argv[3]))
          .then((success) => {
            if (success) {
              console.log('✅ Full processing workflow completed successfully');
            } else {
              console.log('⚠️  Processing completed with download issues');
            }
            return automation.close();
          })
          .catch(console.error);
        break;

      default:
        console.log('Available commands:');
        console.log('  login - Show login page for manual authentication');
        console.log('  process <image-path> - Upload image, wait for generation, and download result');
        break;
    }
  } else {
    console.log('Playflows - Workflow Automation Tool');
    console.log('Usage: playflows <command>');
    console.log('Commands: login, process');
  }
}