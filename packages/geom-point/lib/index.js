"use strict";Object.defineProperty(exports,"__esModule",{value:!0});var e=require("tslib"),t=require("react"),a=require("@visx/shape"),n=require("@visx/scale"),l=require("d3-array");require("d3-time-format");var o=require("d3-scale-chromatic"),u=require("recoil"),r=require("@graphique/gg"),i=require("@visx/voronoi");function s(e){return e&&"object"==typeof e&&"default"in e?e:{default:e}}var c=s(t),d=e.__spreadArrays([o.schemeTableau10[0],o.schemeTableau10[1],o.schemeTableau10[4],o.schemeTableau10[2],o.schemeTableau10[3]],o.schemeTableau10.slice(5)),f=function(e){var a=e.data,n=e.x,l=e.y,o=e.onMouseOver,s=e.onMouseLeave,d=e.onClick,f=u.useRecoilValue(r.aesState),m=u.useRecoilValue(r.layoutState),y=m.width,g=m.height,p=m.margin,v=t.useMemo((function(){return i.voronoi({x:function(e){return n(f.x(e))},y:function(e){return l(f.y(e))},width:y,height:g}).extent([[p.left,p.top],[y-p.right,g-p.bottom-p.top]])}),[f,y,g,n,l,p])(a).polygons();return c.default.createElement("g",{onMouseLeave:s?function(e){return s()}:void 0},v.map((function(e,t){return c.default.createElement(i.VoronoiPolygon,{key:"voronoi-polygon-"+t,polygon:e,fill:"transparent",style:{cursor:d?"pointer":"default"},onMouseOver:o?function(a){o({d:e.data,i:t})}:void 0,onClick:d?function(a){return d({d:e.data,i:t})}:void 0})})))},m=function(e){var t=e.data,a=u.useRecoilValue(r.labelsState),n=a.x,l=a.y,o=u.useRecoilValue(r.aesState),i=o.x,s=o.y;return t&&c.default.createElement(r.TooltipContainer,null,t.map((function(e){return c.default.createElement("div",{key:"group-tooltip-"+(e.label||e.group)},c.default.createElement("div",{style:{marginTop:4,marginBottom:4}},(e.label||"__group"!==e.group)&&c.default.createElement(c.default.Fragment,null,e.mark,c.default.createElement("div",{style:{display:"flex",alignItems:"flex-end",fontWeight:500}},c.default.createElement("div",{style:{marginBottom:4}},c.default.createElement("span",null,e.label||e.group," ")))),c.default.createElement("div",{style:{display:"flex",marginBottom:2}},c.default.createElement("div",null,n||i.toString(),":"),c.default.createElement("div",{style:{marginLeft:2,fontWeight:500,fontSize:13}},e.formattedX)),c.default.createElement("div",{style:{display:"flex"}},c.default.createElement("div",null,l||s.toString(),":"),c.default.createElement("div",{style:{marginLeft:2,fontWeight:500,fontSize:13}},e.formattedY))))})))},y=function(e){var t=e.scales,a=e.group,n=e.datum,l=u.useRecoilValue(r.tooltipState),o=l.position,i=l.content,s=l.yFormat,d=l.xFormat,f=l.xAxis,y=u.useRecoilValue(r.aesState),g=u.useRecoilValue(r.layoutState),p=g.id,v=g.height,x=g.margin,h=t.x,E=t.y,k={given:y.label&&y.label(n),keyed:y.key&&y.key(n),default:null==n?void 0:n._id},S=[{x:y.x&&h(y.x(n)),y:y.y&&E(y.y(n)),formattedX:y.x&&(d?d(y.x(n)):y.x(n)),formattedY:y.y&&(s?s(y.y(n)):y.y(n)),group:a(n),label:k.given===k.default?k.keyed:k.given,datum:n}];return c.default.createElement(c.default.Fragment,null,f&&c.default.createElement(r.XTooltip,{id:p,left:S[0].x,top:-x.bottom-5,value:"boolean"==typeof f?c.default.createElement(r.TooltipContainer,null,d?d(y.x(n)):y.x(n)):f({x:y.x(n)})}),c.default.createElement(r.YTooltip,{id:p,left:S[0].x,top:"data"===o?-(v-S[0].y):-v,value:i?i({data:S}):c.default.createElement(m,{data:S})}))},g=function(o){var i=o.data,s=o.stroke,m=o.strokeWidth,g=o.fill,p=o.opacity,v=void 0===p?1:p,x=o.strokeOpacity,h=o.size,E=void 0===h?2.5:h,k=o.scales,S=o.hideTooltip,_=void 0!==S&&S,b=o.focused,M=o.focusedStyle,O=o.unfocusedStyle,q=o.onFocus,T=o.onFocusSelection,R=o.onExit,V=u.useRecoilValue(r.dataState),z=i||V,F=u.useRecoilValue(r.aesState),C=u.useRecoilValue(r.themeState).defaultFill,L=u.useRecoilState(r.scalesState),W=L[0],P=L[1],w=t.useMemo((function(){return W}),[W]),A=w.fill,B=w.stroke,X=w.size,Y=w.groups,j=k.x,G=k.y,I=t.useMemo((function(){return F.group||F.fill||F.stroke||F.size||function(e){return"__group"}}),[F]),N=I?Array.from(new Set(z.map(I))).map((function(e){return null===e?"[null]":e})):["__group"],D=t.useMemo((function(){return n.scaleSqrt({domain:E?[E]:F.size&&l.extent(z,F.size),range:(null==X?void 0:X.range)||[3,30]})}),[z,F.size,E,X]),H=t.useMemo((function(){return function(e){return D&&F.size?D(F.size(e)):E}}),[D,F,E]),J=t.useMemo((function(){return n.scaleOrdinal({domain:Y,range:(null==B?void 0:B.scheme)||(s?[s]:1===(null==Y?void 0:Y.length)?[void 0]:d)})}),[Y,B,s]),K=t.useMemo((function(){return function(e){return J&&F.stroke?J(F.stroke(e)):s}}),[F,J,s]),Q=t.useMemo((function(){return n.scaleOrdinal({domain:Y,range:(null==A?void 0:A.scheme)||(g?[g]:1===(null==Y?void 0:Y.length)?[C]:d)})}),[Y,A,g,C]),U=t.useMemo((function(){return function(e){return Q&&F.fill?Q(F.fill(e)):g||C}}),[F,Q,g,C]),Z=t.useState(b||[]),$=Z[0],ee=Z[1];t.useEffect((function(){ee(b||[])}),[b]),t.useEffect((function(){Y||P((function(t){return e.__assign(e.__assign({},t),{groups:N})}))}),[P,N,Y]);var te=t.useState({x:0,y:0})[0],ae=t.useMemo((function(){return $.length||te.x>3}),[$,te]),ne=e.__assign({fillOpacity:1,strokeOpacity:1},M),le=e.__assign({fillOpacity:.15,strokeOpacity:.15},O);return z?c.default.createElement(c.default.Fragment,null,c.default.createElement("g",null,z.map((function(t,n){var l=F.key&&$.map(F.key).includes(F.key(t));return F.x(t)&&F.y(t)?c.default.createElement(a.Circle,{style:ae?l?e.__assign({},ne):e.__assign({},le):{pointerEvents:"none"},key:"point-"+n,fill:U(t),fillOpacity:v,strokeOpacity:x,stroke:K(t),strokeWidth:m,r:E||H(t),cx:j(F.x(t)),cy:G(F.y(t))}):null}))),!_&&c.default.createElement(c.default.Fragment,null,c.default.createElement(f,{data:z,x:j,y:G,onMouseOver:function(e){var t=e.d;e.i;ee([t]),q&&q({data:t})},onClick:T?function(e){var t=e.d;e.i;T({data:t})}:void 0,onMouseLeave:function(){ee([]),R&&R()}}),$&&$[0]&&c.default.createElement(y,{group:I,datum:$[0],scales:k}))):null};g.displayName="GeomPoint",exports.GeomPoint=g;
//# sourceMappingURL=index.js.map
