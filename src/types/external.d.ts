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
