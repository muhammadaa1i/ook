declare module 'js-cookie' {
  interface CookieAttributes {
    expires?: number | Date;
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: 'strict' | 'Strict' | 'lax' | 'Lax' | 'none' | 'None';
  }
  interface CookiesStatic {
    get(name: string): string | undefined;
    get(): { [key: string]: string };
    set(name: string, value: string | object, options?: CookieAttributes): void;
    remove(name: string, options?: CookieAttributes): void;
  }
  const Cookies: CookiesStatic;
  export default Cookies;
}

// CSS Module declarations
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.sass' {
  const content: { [className: string]: string };
  export default content;
}

// Side-effect CSS imports (for global stylesheets)
declare module '*.css' {
  const content: Record<string, string>;
  export = content;
}

// React Toastify CSS
declare module 'react-toastify/dist/ReactToastify.css';
