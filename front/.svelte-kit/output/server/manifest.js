export const manifest = {
	appDir: "_app",
	assets: new Set(["airplane-tail.png","amadeus_logo.png","favicon.png"]),
	mimeTypes: {".png":"image/png"},
	_: {
		entry: {"file":"start-d68f5d13.js","js":["start-d68f5d13.js","chunks/index-59122b43.js","chunks/index-a11a333a.js"],"css":[]},
		nodes: [
			() => import('./nodes/0.js'),
			() => import('./nodes/1.js'),
			() => import('./nodes/2.js'),
			() => import('./nodes/3.js')
		],
		routes: [
			{
				type: 'page',
				id: "CD",
				pattern: /^\/CD\/?$/,
				names: [],
				types: [],
				path: "/CD",
				shadow: null,
				a: [0,2],
				b: [1]
			},
			{
				type: 'page',
				id: "Index",
				pattern: /^\/Index\/?$/,
				names: [],
				types: [],
				path: "/Index",
				shadow: null,
				a: [0,3],
				b: [1]
			}
		],
		matchers: async () => {
			
			return {  };
		}
	}
};
