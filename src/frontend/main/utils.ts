//#region Async

export async function delay(ms: number)
{
	return new Promise(resolve => setTimeout(resolve, ms));
}

export async function waitUntil(predicate: () => boolean, interval: number = 100)
{
	while (!predicate()) await delay(interval);
}

//#endregion

//#region DOM

export function getTextNodes(element: Element) 
{
	const textNodes: Node[] = [];
	const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);

	let node: Node | null;
	while (node = walker.nextNode()) 
	{
		textNodes.push(node);
	}

	return textNodes;
}

//#endregion

//#region Bounds
export class Bounds
{
	public left: number;
	public right: number;
	public top: number;
	public bottom: number;

	public get width(): number { return this.right - this.left; }
	public get height(): number { return this.bottom - this.top; }
	public get center(): Vector2 { return new Vector2(this.left + this.width / 2, this.top + this.height / 2); }
	public get min(): Vector2 { return new Vector2(this.left, this.top); }
	public get max(): Vector2 { return new Vector2(this.right, this.bottom); }

	constructor(left: number, top: number, width: number, height: number)
	{
		this.left = left;
		this.top = top;
		this.right = left + width;
		this.bottom = top + height;
	}

	public contains(point: Vector2)
	{
		return point.x >= this.left && point.x <= this.right && point.y >= this.top && point.y <= this.bottom;
	}

	public encapsulate(bounds: Bounds)
	{
		this.left = Math.min(this.left, bounds.left);
		this.top = Math.min(this.top, bounds.top);
		this.right = Math.max(this.right, bounds.right);
		this.bottom = Math.max(this.bottom, bounds.bottom);
		return this;
	}

	public encapsulatePoint(point: Vector2)
	{
		if (point.isUndefined) return;
		this.left = Math.min(this.left, point.x);
		this.top = Math.min(this.top, point.y);
		this.right = Math.max(this.right, point.x);
		this.bottom = Math.max(this.bottom, point.y);
		return this;
	}

	public expand(by: number)
	{
		this.left -= by;
		this.right += by;
		this.top -= by;
		this.bottom += by;
		return this;
	}

	public translate(by: Vector2)
	{
		this.left += by.x;
		this.right += by.x;
		this.top += by.y;
		this.bottom += by.y;
		return this;
	}

	public scale(by: number)
	{
		this.left *= by/2;
		this.right *= by/2;
		this.top *= by/2;
		this.bottom *= by/2;
		return this;
	}

	public static fromElement(el: HTMLElement)
	{
		const rect = el.getBoundingClientRect();
		return new Bounds(rect.x, rect.y, rect.width, rect.height);
	}
}
//#endregion

//#region Vector2
export class Vector2
{
	x: number;
	y: number;

	constructor(x: number, y: number)
	{
		this.x = x;
		this.y = y;
	}

	public add(point: Vector2)
	{
		return new Vector2(this.x + point.x, this.y + point.y);
	}

	public sub(point: Vector2)
	{
		return new Vector2(this.x - point.x, this.y - point.y);
	}

	public scale(scalar: number)
	{
		return new Vector2(this.x * scalar, this.y * scalar);
	}

	public divide(scalar: number)
	{
		return new Vector2(this.x / scalar, this.y / scalar);
	}

	public get isUndefined()
	{
		return isNaN(this.x) || isNaN(this.y);
	}

	public get magnitude()
	{
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}

	public get normalized()
	{
		const mag = this.magnitude;
		return new Vector2(this.x / mag, this.y / mag);
	}

	public get inverse()
	{
		return new Vector2(-this.x, -this.y);
	}

	public static distance(a: Vector2, b: Vector2)
	{
		return a.sub(b).magnitude;
	}

	public static dot(a: Vector2, b: Vector2)
	{
		return a.x * b.x + a.y * b.y;
	}

	public static readonly Undefined: Vector2 = new Vector2(NaN, NaN);
}
//#endregion

//#region Ticker
export class Ticker
{
	private _lastTime: number;
	private _deltaTime: number;
	private _time: number;

	public targetFPS: number;
	private measuredFPS: number;

	public get deltaTime() { return this._deltaTime / 1000; }
	public get time() { return this._time; }
	private callbacks: ((deltaTime: number) => void)[] = [];

	constructor(targetFPS: number)
	{
		this.targetFPS = targetFPS;
		this.measuredFPS = targetFPS;
		this._lastTime = performance.now();
		this._deltaTime = 1 / targetFPS;
		this._time = this._lastTime;
	}
	

	public async start()
	{
		while (true)
		{
			this._time = performance.now();
		
			requestAnimationFrame(() => {
				for (let callback of this.callbacks) {
					callback(this.deltaTime);
				}
			}
			);

			const dt = this._time - this._lastTime;
			let deltaDiff = dt - (1000 / this.targetFPS);
			this._lastTime = this._time + Math.max(deltaDiff, 0);
			
			await delay(Math.max(0, deltaDiff));
		
			this._deltaTime = Math.min(dt + Math.max(deltaDiff, 0), 1000 / this.targetFPS * 3);
			
			this.measuredFPS = (1 / this.deltaTime) * 0.1 + this.measuredFPS * 0.9;
		}
	}

	public add(callback: (deltaTime: number) => void)
	{
		this.callbacks.push(callback);
	}
}
//#endregion

//#region Animation
export function slideUp(target: HTMLElement, duration: number = 500)
{
	if (target.style.display === 'none') return;
	target.style.transitionProperty = 'height, margin, padding';
	target.style.transitionDuration = duration + 'ms';
	target.style.boxSizing = 'border-box';
	target.style.height = target.offsetHeight + 'px';
	target.offsetHeight;
	target.style.overflow = 'hidden';
	target.style.height = "0";
	target.style.paddingTop = "0";
	target.style.paddingBottom = "0";
	target.style.marginTop = "0";
	target.style.marginBottom = "0";
	window.setTimeout(async () => {
			target.style.display = 'none';
			target.style.removeProperty('height');
			target.style.removeProperty('padding-top');
			target.style.removeProperty('padding-bottom');
			target.style.removeProperty('margin-top');
			target.style.removeProperty('margin-bottom');
			target.style.removeProperty('overflow');
			target.style.removeProperty('transition-duration');
			target.style.removeProperty('transition-property');
	}, duration);
}

export function slideUpAll(targets: HTMLElement[], duration: number = 500)
{
	targets.forEach(async target => {
		if (!target) return;
		target.style.transitionProperty = 'height, margin, padding';
		target.style.transitionDuration = duration + 'ms';
		target.style.boxSizing = 'border-box';
		target.style.height = target.offsetHeight + 'px';
		target.offsetHeight;
		target.style.overflow = 'hidden';
		target.style.height = "0;"
		target.style.paddingTop = "0";
		target.style.paddingBottom = "0";
		target.style.marginTop = "0";
		target.style.marginBottom = "0";
	});

	window.setTimeout(async () => {
		targets.forEach(async target => {
			if (!target) return;
			target.style.display = 'none';
			target.style.removeProperty('height');
			target.style.removeProperty('padding-top');
			target.style.removeProperty('padding-bottom');
			target.style.removeProperty('margin-top');
			target.style.removeProperty('margin-bottom');
			target.style.removeProperty('overflow');
			target.style.removeProperty('transition-duration');
			target.style.removeProperty('transition-property');
		});
	}, duration);
}

export function slideDown(target: HTMLElement, duration: number = 500)
{
	if (window.getComputedStyle(target).display !== 'none') return;
	target.style.removeProperty('display');
	let display = window.getComputedStyle(target).display;
	if (display === 'none') display = 'block';
	target.style.display = display;
	const height = target.offsetHeight;
	target.style.overflow = 'hidden';
	target.style.height = "0";
	target.style.paddingTop = "0";
	target.style.paddingBottom = "0";
	target.style.marginTop = "0";
	target.style.marginBottom = "0";
	target.offsetHeight;
	target.style.boxSizing = 'border-box';
	target.style.transitionProperty = "height, margin, padding";
	target.style.transitionDuration = duration + 'ms';
	target.style.height = height + 'px';
	target.style.removeProperty('padding-top');
	target.style.removeProperty('padding-bottom');
	target.style.removeProperty('margin-top');
	target.style.removeProperty('margin-bottom');
	window.setTimeout(async () => {
		target.style.removeProperty('height');
		target.style.removeProperty('overflow');
		target.style.removeProperty('transition-duration');
		target.style.removeProperty('transition-property');
	}, duration);
}

export function slideDownAll(targets: HTMLElement[], duration: number = 500)
{
	targets.forEach(async target => {
		if (!target) return;
		target.style.removeProperty('display');
		let display = window.getComputedStyle(target).display;
		if (display === 'none') display = 'block';
		target.style.display = display;
		const height = target.offsetHeight;
		target.style.overflow = 'hidden';
		target.style.height = "0";
		target.style.paddingTop = "0";
		target.style.paddingBottom = "0";
		target.style.marginTop = "0";
		target.style.marginBottom = "0";
		target.offsetHeight;
		target.style.boxSizing = 'border-box';
		target.style.transitionProperty = "height, margin, padding";
		target.style.transitionDuration = duration + 'ms';
		target.style.height = height + 'px';
		target.style.removeProperty('padding-top');
		target.style.removeProperty('padding-bottom');
		target.style.removeProperty('margin-top');
		target.style.removeProperty('margin-bottom');
	});

	window.setTimeout( async () => {
		targets.forEach(async target => {
			if (!target) return;
			target.style.removeProperty('height');
			target.style.removeProperty('overflow');
			target.style.removeProperty('transition-duration');
			target.style.removeProperty('transition-property');
		});
	}, duration);
}

export function slideToggle(target: HTMLElement, duration: number = 500)
{
	if (window.getComputedStyle(target).display === 'none') 
	{
		return slideDown(target, duration);
	} else 
	{
		return slideUp(target, duration);
	}
}

export function slideToggleAll(targets: HTMLElement[], duration: number = 500)
{
	if (window.getComputedStyle(targets[0]).display === 'none') 
	{
		return slideDownAll(targets, duration);
	} else 
	{
		return slideUpAll(targets, duration);
	}
}

//#endregion

//#region Events
export function getPointerPosition(event: MouseEvent | TouchEvent)
{
	const touches = event instanceof TouchEvent ? Array.from(event.touches) : [];
	const x = (touches.length > 0 && event instanceof TouchEvent) ? (touches.reduce((acc, cur) => acc + cur.clientX, 0) / touches.length) : (event as MouseEvent).clientX;
	const y = (touches.length > 0 && event instanceof TouchEvent) ? (touches.reduce((acc, cur) => acc + cur.clientY, 0) / touches.length) : (event as MouseEvent).clientY;
	return new Vector2(x, y);
}

export function getTouchPositionVector(touch: Touch)
{
	return {x: touch.clientX, y: touch.clientY};
}

//#endregion

//#region Math
export function InOutQuadBlend(start: number, end: number, t: number): number
{
	t /= 2;
	let t2 = 2.0 * t * (1.0 - t) + 0.5;
	t2 -= 0.5;
	t2 *= 2.0;
	return start + (end - start) * t2;
}
//#endregion
