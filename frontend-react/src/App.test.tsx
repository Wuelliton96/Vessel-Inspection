import React from 'react';

describe('App Component', () => {
  test('App module can be imported', () => {
    const App = require('./App').default;
    expect(App).toBeDefined();
  });

  test('App is a valid React component', () => {
    const App = require('./App').default;
    expect(typeof App).toBe('function');
  });
});

