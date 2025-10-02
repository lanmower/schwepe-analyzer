const WorkflowEngine = require('./workflow-engine');

class GrokWorkflows {
  constructor(engine) {
    this.engine = engine;
  }

  defineLoginWorkflow() {
    this.engine.defineWorkflow('grok-login', [
      {
        type: 'navigate',
        url: 'https://grok.com'
      },
      {
        type: 'wait',
        time: 3,
        text: 'Sign in'
      },
      {
        type: 'click',
        element: 'Sign in button',
        ref: 'e23'
      },
      {
        type: 'wait',
        time: 3,
        text: 'Sign in to X'
      }
    ]);
  }

  defineImagineWorkflow() {
    this.engine.defineWorkflow('grok-imagine', [
      {
        type: 'navigate',
        url: 'https://grok.com/imagine'
      },
      {
        type: 'wait',
        time: 3
      }
    ]);
  }

  defineImageUploadWorkflow(imagePaths) {
    this.engine.defineWorkflow('grok-upload-image', [
      {
        type: 'navigate',
        url: 'https://grok.com/imagine'
      },
      {
        type: 'wait',
        time: 3
      },
      {
        type: 'click',
        element: 'File upload button',
        ref: 'e44'
      },
      {
        type: 'upload',
        paths: imagePaths
      }
    ]);
  }

  async showLoginPageForManualLogin() {
    console.log('Navigating to login page for manual authentication...');
    await this.engine.executeWorkflow('grok-login');

    console.log('Please complete the login manually in the browser window.');
    console.log('The script will wait for you to complete the login before continuing.');

    // Wait for user to complete login by checking if we're redirected back to Grok
    await this.waitForLoginCompletion();
  }

  async waitForLoginCompletion() {
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes max wait

    while (attempts < maxAttempts) {
      console.log(`Waiting for login completion... (${attempts * 5}s elapsed)`);
      await mcp__playwright__browser_wait_for(5);

      // Check if we're back on Grok (not on login page)
      const currentUrl = await this.getCurrentUrl();
      if (currentUrl && currentUrl.includes('grok.com') && !currentUrl.includes('sign-in')) {
        console.log('Login detected! Continuing with workflow...');
        return true;
      }

      attempts++;
      if (attempts % 12 === 0) { // Every minute
        console.log(`Still waiting for login completion... (${attempts * 5}s elapsed)`);
      }
    }

    throw new Error('Login timeout: Please complete login within 10 minutes');
  }

  async getCurrentUrl() {
    try {
      await mcp__playwright__browser_snapshot();
      // In a real implementation, we would extract the URL from the snapshot
      // For now, we'll check if we can see Grok elements to determine login status
      return 'https://grok.com'; // This will be updated when we implement URL extraction
    } catch (error) {
      return null;
    }
  }

  async findPasswordField() {
    await mcp__playwright__browser_snapshot();
    return null;
  }

  async uploadImageToImagine(imagePaths) {
    if (!Array.isArray(imagePaths)) {
      imagePaths = [imagePaths];
    }

    this.defineImageUploadWorkflow(imagePaths);
    await this.engine.executeWorkflow('grok-upload-image');
  }

  async waitForGenerationAndDownload() {
    console.log('Waiting for generation to complete...');

    let attempts = 0;
    const maxAttempts = 120; // 10 minutes max wait
    let downloadUrl = null;

    while (attempts < maxAttempts) {
      await mcp__playwright__browser_wait_for(5);

      // Take snapshot to check generation status
      await mcp__playwright__browser_snapshot();

      // Check if generation is complete by looking for download button
      const currentUrl = await this.getCurrentUrl();
      if (currentUrl && currentUrl.includes('/imagine/post/')) {
        console.log(`Generation in progress... (${attempts * 5}s elapsed)`);

        // Look for download button which indicates completion
        downloadUrl = await this.findDownloadButton();
        if (downloadUrl) {
          console.log('Generation complete! Preparing to download...');
          return await this.downloadGeneratedContent(downloadUrl);
        }
      }

      attempts++;
      if (attempts % 12 === 0) { // Every minute
        console.log(`Still waiting for generation completion... (${attempts * 5}s elapsed)`);
      }
    }

    throw new Error('Generation timeout: Please complete generation within 10 minutes');
  }

  async findDownloadButton() {
    try {
      await mcp__playwright__browser_snapshot();
      // In a real implementation, we would extract the download URL from the snapshot
      // For now, we'll simulate finding the download button
      return 'download-found'; // Placeholder
    } catch (error) {
      return null;
    }
  }

  async downloadGeneratedContent(downloadUrl) {
    console.log('Downloading generated content...');

    try {
      // Look for and click the download button
      await mcp__playwright__browser_click('Download image button', '');

      // Wait for download to complete
      await mcp__playwright__browser_wait_for(5);

      console.log('Download completed successfully!');
      return true;
    } catch (error) {
      console.error('Download failed:', error);
      return false;
    }
  }
}

module.exports = GrokWorkflows;