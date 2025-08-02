// Playground - Demo UI for WebRunnr
import WebRunnrCore from '@webrunnr/core';

export class Playground {
  private core: WebRunnrCore;
  private editor: HTMLTextAreaElement | null = null;
  private output: HTMLPreElement | null = null;
  private language: string = 'javascript';

  constructor() {
    this.core = new WebRunnrCore();
  }

  initialize(): void {
    // Code input
    this.editor = document.createElement('textarea');
    this.editor.placeholder = 'Enter your code here...';
    this.editor.style.width = '100%';
    this.editor.style.height = '120px';

    // Language chooser
    const langDiv = document.createElement('div');
    const languages = [
      'javascript',
      'typescript',
      'java',
      'python',
      'cpp',
      'go',
      'rust',
    ];
    languages.forEach(lang => {
      const label = document.createElement('label');
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'language';
      radio.value = lang;
      if (lang === this.language) radio.checked = true;
      radio.onchange = () => {
        this.language = lang;
      };
      label.appendChild(radio);
      label.appendChild(document.createTextNode(' ' + lang + ' '));
      langDiv.appendChild(label);
    });

    // Execute button
    const runButton = document.createElement('button');
    runButton.textContent = 'Execute';
    runButton.onclick = () => {
      if (this.editor) {
        this.executeCode(this.editor.value, this.language);
      }
    };

    // Output terminal
    this.output = document.createElement('pre');
    this.output.style.background = '#222';
    this.output.style.color = '#fff';
    this.output.style.padding = '1em';
    this.output.style.minHeight = '80px';

    // Add to document
    document.body.appendChild(this.editor);
    document.body.appendChild(langDiv);
    document.body.appendChild(runButton);
    document.body.appendChild(this.output);
  }

  private async executeCode(source: string, language: string): Promise<void> {
    if (!this.output) return;
    this.output.textContent = 'Running...';
    console.log(`playground calling ${language} code:\n${source}`);
    const result = await this.core.execute({ code: source, language });
    this.output.textContent = `stdout:\n${result.stdout}\nstderr:\n${result.stderr}`;
  }
}

export default Playground;

// Auto-initialize playground if running in browser
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const playground = new Playground();
    playground.initialize();
  });
}
