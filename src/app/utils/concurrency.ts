import { Assets } from "pixi.js";

/**
 * Loads a single asset with a timeout.
 * @param src The URL or key of the asset to load.
 * @param loadOptions Additional options for the loader.
 * @param timeoutMs Timeout in milliseconds (default: 5000).
 * @returns The loaded resource or throws an error on failure/timeout.
 */
export async function loadWithTimeout<T = unknown>(
  src: string,
  loadOptions: Record<string, unknown> = {},
  timeoutMs: number = 5000,
): Promise<T> {
  const controller = new AbortController();
  const { signal } = controller;

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      controller.abort();
      reject(new Error(`Loading timed out after ${timeoutMs}ms for ${src}`));
    }, timeoutMs);
  });

  try {
    const loadPromise = Assets.load({
      src,
      ...loadOptions,
      signal, // PixiJS supports signal in LoadAsset options if using specific loaders, otherwise ignored.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const resource = await Promise.race([loadPromise, timeoutPromise]);
    console.log("Asset loaded successfully:", src);
    return resource as T;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("Asset load was canceled due to timeout.");
    } else {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`Asset load failed for ${src}:`, errorMessage);
    }
    throw error;
  }
}

/**
 * Loads multiple assets with a timeout.
 * @param srcs List of URLs or keys to load.
 * @param loadOptions Additional options for the loader.
 * @param timeoutMs Timeout in milliseconds (default: 5000).
 * @returns True if all assets loaded successfully, false otherwise.
 */
export async function loadWithTimeoutMultiple(
  srcs: string[],
  loadOptions: Record<string, unknown> = {},
  timeoutMs: number = 5000,
): Promise<boolean> {
  const controller = new AbortController();
  const { signal } = controller;

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      controller.abort();
      reject(
        new Error(`Loading multiple assets timed out after ${timeoutMs}ms`),
      );
    }, timeoutMs);
  });

  try {
    const loadPromises = srcs.map((src) => {
      return Assets.load({
        src,
        ...loadOptions,
        signal,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    });

    const loadAllPromise = Promise.all(loadPromises);
    await Promise.race([loadAllPromise, timeoutPromise]);

    console.log(`All ${srcs.length} assets loaded successfully.`);
    return true;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("Assets load was canceled due to timeout.");
    } else {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Assets load failed:", errorMessage);
    }
    return false;
  }
}
