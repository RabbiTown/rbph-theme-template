// RBPH template infrastructure. Theme developers should not modify this file.

declare module '*.css';

declare module '*.css?inline' {
  const css: string;
  export default css;
}
