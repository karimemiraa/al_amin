/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user: import('./lib/server/auth').User | null;
    session: import('./lib/server/auth').Session | null;
    flash: import('./admin/util').Flash | null;
  }
}
