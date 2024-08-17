import './src/blocks/AppComponent';  // Make sure this path is correct

document.addEventListener('DOMContentLoaded', () => {
  const app = document.querySelector('#app');
  if (app) {
    const appComponent = document.createElement('app-component');
    app.appendChild(appComponent);
  } else {
    console.error('Could not find app container element');
  }
});