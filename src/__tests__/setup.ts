import '@testing-library/jest-dom';

// JSDOM 未实现 window.scrollTo，统一 mock 掉避免测试输出中出现 "Not implemented" 错误
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
});

// JSDOM 也没有实现 Element.prototype.scrollTo
Element.prototype.scrollTo = function(options?: ScrollToOptions | number, y?: number) {
  if (typeof options === 'object' && options !== null) {
    if (options.top !== undefined) this.scrollTop = options.top;
    if (options.left !== undefined) this.scrollLeft = options.left;
  } else if (typeof options === 'number' && typeof y === 'number') {
    this.scrollLeft = options;
    this.scrollTop = y;
  }
};
