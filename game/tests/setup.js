// Test setup file for vitest
// This file runs before all tests
import { vi } from 'vitest';

// Mock phaser3spectorjs module that Phaser tries to load
vi.mock('phaser3spectorjs', () => ({}), { virtual: true });

// Mock HTMLCanvasElement.getContext to prevent Phaser canvas initialization errors
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = function(contextType) {
    if (contextType === '2d' || contextType === 'webgl' || contextType === 'webgl2') {
      return {
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        fillRect: () => {},
        strokeRect: () => {},
        clearRect: () => {},
        beginPath: () => {},
        closePath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        arc: () => {},
        fill: () => {},
        stroke: () => {},
        save: () => {},
        restore: () => {},
        translate: () => {},
        rotate: () => {},
        scale: () => {},
        drawImage: () => {},
        getImageData: () => ({ data: [] }),
        putImageData: () => {},
        createImageData: () => ({ data: [] }),
        measureText: () => ({ width: 0 }),
        canvas: this,
        // WebGL context methods
        createShader: () => ({}),
        shaderSource: () => {},
        compileShader: () => {},
        createProgram: () => ({}),
        attachShader: () => {},
        linkProgram: () => {},
        useProgram: () => {},
        getAttribLocation: () => 0,
        getUniformLocation: () => ({}),
        enableVertexAttribArray: () => {},
        vertexAttribPointer: () => {},
        uniform1f: () => {},
        uniform2f: () => {},
        uniform3f: () => {},
        uniform4f: () => {},
        uniformMatrix4fv: () => {},
        createBuffer: () => ({}),
        bindBuffer: () => {},
        bufferData: () => {},
        clear: () => {},
        enable: () => {},
        disable: () => {},
        blendFunc: () => {},
        viewport: () => {},
        drawArrays: () => {},
        drawElements: () => {},
      };
    }
    return null;
  };
}

// Mock Phaser if needed
global.Phaser = {
  Math: {
    Clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
    Between: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
  },
};
