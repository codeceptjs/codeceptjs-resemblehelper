/// <reference types='codeceptjs' />
type steps_file = typeof import('./steps_file');
type ResembleHelper = import('../src/index');

declare namespace CodeceptJS {
  interface SupportObject { I: I, current: any }
  interface Methods extends Playwright, ResembleHelper {}
  interface I extends ReturnType<steps_file>, WithTranslation<ResembleHelper>, WithTranslation<Playwright> {}
  namespace Translation {
    interface Actions {}
  }
}
