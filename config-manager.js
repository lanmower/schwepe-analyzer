const fs = require('fs').promises;
const path = require('path');

class ConfigManager {
  constructor(configPath = './config.json') {
    this.configPath = configPath;
    this.config = {};
  }

  async loadConfig() {
    try {
      const configData = await fs.readFile(this.configPath, 'utf8');
      this.config = JSON.parse(configData);
    } catch (error) {
      console.log('No config file found, using defaults');
      this.config = this.getDefaultConfig();
      await this.saveConfig();
    }
    return this.config;
  }

  async saveConfig() {
    try {
      await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  getDefaultConfig() {
    return {
      grok: {
        baseUrl: 'https://grok.com',
        credentials: {
          email: '',
          password: ''
        }
      },
      userProfile: {
        name: 'Default User',
        dataDir: './user-data',
        persistent: true
      },
      workflow: {
        timeout: 30000,
        retries: 3,
        headless: false
      },
      imagePaths: [],
      lastRun: null
    };
  }

  getCredentials() {
    return this.config.grok?.credentials || {};
  }

  async setCredentials(email, password) {
    if (!this.config.grok) {
      this.config.grok = {};
    }
    this.config.grok.credentials = { email, password };
    await this.saveConfig();
  }

  getImagePaths() {
    return this.config.imagePaths || [];
  }

  async addImagePath(imagePath) {
    if (!this.config.imagePaths) {
      this.config.imagePaths = [];
    }
    if (!this.config.imagePaths.includes(imagePath)) {
      this.config.imagePaths.push(imagePath);
      await this.saveConfig();
    }
  }
}

module.exports = ConfigManager;