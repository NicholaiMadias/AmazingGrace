export type Wave = OscillatorType;

export interface Stats { score: number; energy: number; hp: number; }

/** Services the Game provides to each level module. */
export interface LevelHost {
    ctx: CanvasRenderingContext2D;
    readonly width: number;
    readonly height: number;
    readonly stats: Stats;
    /** The current level number (1-6). */
    readonly level: number;
    sound(freq: number, duration?: number, type?: Wave): void;
    changed(): void;
    complete(): void;
    fail(): void;
}

export interface PointerInfo { x: number; y: number; }

export interface Level {
    update(dt: number): void;
    render(): void;
    pointerDown?(p: PointerInfo): void;
    pointerMove?(p: PointerInfo): void;
    pointerUp?(p: PointerInfo): void;
    pointerCancel?(): void;
    /** Return true when the key was handled. */
    keyDown?(key: string): boolean;
}
