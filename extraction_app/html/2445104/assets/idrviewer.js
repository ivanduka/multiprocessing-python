/*! IDRViewer - v1.10.2 | Copyright 2020 IDRsolutions */
!function () {
    "use strict";
    var a, b, c, d, e, f, g, h, i, j, k = {
            LAYOUT_PRESENTATION: "presentation",
            LAYOUT_MAGAZINE: "magazine",
            LAYOUT_CONTINUOUS: "continuous",
            SELECT_SELECT: "select",
            SELECT_PAN: "pan",
            ZOOM_SPECIFIC: "specific",
            ZOOM_ACTUALSIZE: "actualsize",
            ZOOM_FITWIDTH: "fitwidth",
            ZOOM_FITHEIGHT: "fitheight",
            ZOOM_FITPAGE: "fitpage",
            ZOOM_AUTO: "auto"
        }, l = 1, m = 0, n = !0, o = [], p = [], q = 10, r = {}, s = !1, t = "", u = [], v = !1,
        w = "continuous_horizontal", x = !1;
    k.setup = function (r) {
        r || (r = IDRViewer.config), s = !0, d = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent), f = "svgz" === r.pageType, e = f || "svg" === r.pageType, g = r.bounds, m = r.pagecount, r.url && (t = r.url), x = !!r.isR2L, A.setup(), b = K("idrviewer"), x && L.addClass(b, "isR2L"), J.setup();
        var u = document.createElement("style");
        u.setAttribute("type", "text/css"), document.head.appendChild(u), i = u.sheet, (l < 1 || l > m) && (l = 1);
        for (var v = 0; v < m; v++) if (g[v][0] != g[0][0] || g[v][1] != g[0][1]) {
            n = !1;
            break
        }
        switch (j) {
            case IDRViewer.LAYOUT_CONTINUOUS:
            case w:
            case IDRViewer.LAYOUT_PRESENTATION:
            case IDRViewer.LAYOUT_MAGAZINE:
                break;
            default:
                j = IDRViewer.LAYOUT_CONTINUOUS
        }
        var z = [k.LAYOUT_PRESENTATION, k.LAYOUT_CONTINUOUS, k.LAYOUT_MAGAZINE];
        switch (j) {
            case IDRViewer.LAYOUT_CONTINUOUS:
                c = E;
                break;
            case w:
                c = F;
                break;
            case IDRViewer.LAYOUT_MAGAZINE:
                c = D;
                break;
            case IDRViewer.LAYOUT_PRESENTATION:
                c = C
        }
        window.addEventListener("resize", function () {
            J.updateZoom()
        }), e && window.addEventListener("mousedown", function (a) {
            0 === a.button && H(window)
        });
        var B = document.createElement("div");
        for (B.style.position = "relative", B.style.display = "inline-block", B.style.verticalAlign = "middle", B.style.minWidth = "100%", B.style.lineHeight = "normal", b.appendChild(B), h = document.createElement("div"), h.id = "overlay", B.appendChild(h), I.setup(), a = document.createElement("div"), a.id = "contentContainer", a.style.overflow = "hidden", a.style.transform = "translateZ(0)", a.style.padding = q / 2 + "px", B.appendChild(a), v = 1; v <= m; v++) {
            var G = document.createElement("div");
            G.id = "page" + v, G.setAttribute("style", "width: " + g[v - 1][0] + "px; height: " + g[v - 1][1] + "px;"), G.className = "page", a.appendChild(G), p[v] = G, o[v] = y(G, v)
        }
        c.setup(l), L.addClass(b, "layout-" + c.toString()), J.updateZoomToDefault(), c.goToPage(l), A.setPage(l, !0);
        var M = {
            selectMode: I.currentSelectMode,
            isMobile: d,
            layout: c.toString(),
            availableLayouts: z,
            isFirstPage: 1 === l,
            isLastPage: c.isLastPage(l)
        };
        for (var N in r) r.hasOwnProperty(N) && (M[N] = r[N]);
        M.page = l, k.fire("ready", M)
    };
    var y = function (a, b) {
        var c = {};
        return c.isVisible = function () {
            return A.getState(b) === z.LOADED
        }, c.isLoaded = function () {
            var a = A.getState(b);
            return a === z.LOADED || a === z.HIDDEN
        }, c.hide = function () {
            A.getState(b) === z.LOADED && (A.setState(b, z.HIDDEN), a.firstChild.style.display = "none")
        }, c.unload = function () {
            A.getState(b) !== z.LOADED && A.getState(b) !== z.HIDDEN || (A.setState(b, z.UNLOADED), a.removeChild(a.firstChild), k.fire("pageunload", {page: b}))
        }, c.load = function () {
            var c = A.getState(b);
            if (c === z.HIDDEN && (A.setState(b, z.LOADED), a.firstChild.style.display = "block"), c === z.UNLOADED) if (A.setState(b, z.LOADING), e) {
                var d = function () {
                    A.setState(b, z.LOADED), this.removeEventListener("load", d);
                    try {
                        this.contentDocument.addEventListener("mousedown", function (a) {
                            0 === a.button && H(window)
                        })
                    } catch (a) {
                    }
                    k.fire("pageload", {page: b})
                }, h = document.createElement("object");
                h.setAttribute("width", "" + g[b - 1][0]), h.setAttribute("height", "" + g[b - 1][1]), h.setAttribute("data", t + b + (f ? ".svgz" : ".svg")), h.setAttribute("type", "image/svg+xml"), h.setAttribute("class", "page-inner"), h.addEventListener("load", d), a.appendChild(h)
            } else {
                var j = function () {
                    var c = document.createElement("iframe");
                    c.setAttribute("class", "page-inner"), c.setAttribute("src", t + b + ".html"), c.setAttribute("style", "width: " + g[b - 1][0] + "px; height: " + g[b - 1][1] + "px; position: relative; border: 0;"), c.onload = function () {
                        A.setState(b, z.LOADED), k.fire("pageload", {page: b})
                    }, a.appendChild(c)
                }, l = function () {
                    var c = new XMLHttpRequest;
                    c.open("GET", t + b + ".html", !0), c.onload = function () {
                        if (c.status >= 200 && c.status < 400) {
                            var d = document.createElement("div");
                            d.innerHTML = c.responseText;
                            var e = d.querySelector("#p" + b);
                            e.style.margin = "0", e.style.overflow = "hidden", e.style.position = "relative";
                            var f = function () {
                                A.setState(b, z.LOADED), this && this.removeEventListener("load", f), k.fire("pageload", {page: b})
                            }, g = e.querySelector("#pdf" + b), h = g.getAttribute("data") || g.getAttribute("src");
                            if (h && g.addEventListener("load", f), t) {
                                var l = g.getAttribute("data");
                                l ? g.setAttribute("data", t + l) : (l = g.getAttribute("src"), l && l.indexOf("base64") === -1 && g.setAttribute("src", t + l))
                            }
                            var m = e.querySelector("#fonts" + b);
                            if (m) {
                                var n = m.innerHTML;
                                m.parentNode.removeChild(m), n.match(/@font-face {[\s\S]*?}/g).forEach(function (a) {
                                    u.indexOf(a) === -1 && (u.push(a), i.insertRule(a.replace('url("', 'url("' + t), i.cssRules.length))
                                })
                            }
                            var o = e.querySelector(".shared-css");
                            o && (o.parentNode.removeChild(o), v || (document.head.appendChild(o), v = !0)), L.addClass(e, "page-inner"), a.appendChild(e), h || f()
                        } else j()
                    }, c.onerror = j;
                    try {
                        c.send()
                    } catch (d) {
                    }
                };
                try {
                    l()
                } catch (m) {
                    j()
                }
            }
        }, c
    }, z = {LOADING: "loading", HIDDEN: "hidden", UNLOADED: "unloaded", LOADED: "loaded"}, A = function () {
        var a, b, c, d = {}, e = 500, f = 50, g = 20, h = 2, i = 0, j = 0, k = 0, l = [];
        d.setup = function () {
            c = m;
            for (var a = 1; a <= m; a++) l[a] = z.UNLOADED
        }, d.getState = function (a) {
            return l[a]
        }, d.setState = function (a, b) {
            n(l[a], b), l[a] = b
        };
        var n = function (a, b) {
            switch (a) {
                case z.LOADING:
                    i--;
                    break;
                case z.LOADED:
                    j--;
                    break;
                case z.HIDDEN:
                    k--;
                    break;
                case z.UNLOADED:
                    c--
            }
            switch (b) {
                case z.LOADING:
                    i++;
                    break;
                case z.LOADED:
                    j++;
                    break;
                case z.HIDDEN:
                    k++;
                    break;
                case z.UNLOADED:
                    c++
            }
        }, p = function () {
            if (o[a].load(), i < h) for (var d = 1; d < g / 2 && (q(a - d) && (o[a - d].isVisible() || o[a - d].load()), i !== h) && (q(a + d) && (o[a + d].isVisible() || o[a + d].load()), i !== h); d++) ;
            for (var k = 1, l = m; j + i > g;) a - k > l - a ? (o[k].isVisible() && o[k].hide(), k++) : (o[l].isVisible() && o[l].hide(), l--);
            for (k = 1, l = m; m - c > f;) a - k > l - a ? (o[k].isLoaded() && o[k].unload(), k++) : (o[l].isLoaded() && o[l].unload(), l--);
            b = setTimeout(p, e)
        }, q = function (a) {
            return a >= 1 && a <= m
        };
        return d.setPage = function (c, d) {
            a = c, d && o[c].load(), clearTimeout(b), b = setTimeout(p, e)
        }, d.stopLoading = function () {
            clearTimeout(b), b = setTimeout(p, e)
        }, d
    }(), B = function (a) {
        l != a && (l = a, A.setPage(a), k.fire("pagechange", {
            page: l,
            pagecount: m,
            isFirstPage: 1 === l,
            isLastPage: c.isLastPage(a)
        }))
    }, C = function () {
        var c = {};
        c.setup = function () {
        }, c.unload = function () {
            for (var b = 1; b <= m; b++) p[b].style.marginLeft = "", p[b].style.marginTop = "", L.removeClass(p[b], "current", "prev", "next", "before", "after");
            a.style.width = "", a.style.height = ""
        }, c.goToPage = function (a) {
            B(a), n || J.updateZoom(), b.scrollTop = 0, d(a), c.updateLayout()
        }, c.getVisiblePages = function () {
            return [l]
        };
        var d = function (a) {
            for (var b = 1; b <= m; b++) L.removeClass(p[b], "current", "prev", "next", "before", "after"), b < a ? L.addClass(p[b], "before") : b > a && L.addClass(p[b], "after");
            L.addClass(p[a], "current"), a - 1 >= 1 && L.addClass(p[a - 1], "prev"), a + 1 <= m && L.addClass(p[a + 1], "next")
        };
        return c.updateLayout = function () {
            var c = J.getZoom(), d = Math.floor(g[l - 1][0] * c), e = 0, f = b.clientWidth - q;
            f > d ? e = (f - d) / 2 : f = d;
            var h = Math.floor(g[l - 1][1] * c), i = 0, j = b.clientHeight - q;
            j > h ? i = (j - h) / 2 : j = h, a.style.width = f + "px", a.style.height = j + "px";
            for (var k = 1; k <= m; k++) p[k].style.marginLeft = e + "px", p[k].style.marginTop = i + "px"
        }, c.isLastPage = function (a) {
            return a === m
        }, c.getZoomBounds = function () {
            return {width: g[l - 1][0], height: g[l - 1][1]}
        }, c.getAutoZoom = function (a, b) {
            return Math.min(a, b)
        }, c.next = function () {
            k.goToPage(l + 1)
        }, c.prev = function () {
            k.goToPage(l - 1)
        }, c.toString = function () {
            return IDRViewer.LAYOUT_PRESENTATION
        }, c
    }(), D = function () {
        function c(a) {
            return a > 1 && a < m
        }

        var d = {};
        d.setup = function () {
        }, d.unload = function () {
            for (var b = 1; b <= m; b++) p[b].style.marginLeft = "", p[b].style.marginTop = "", L.removeClass(p[b], "current", "prev", "next", "before", "after");
            a.style.width = "", a.style.height = ""
        }, d.goToPage = function (a) {
            1 !== a && a % 2 !== 0 && (a -= 1), B(a), n || J.updateZoom(), e(a), d.updateLayout()
        }, d.getVisiblePages = function () {
            var a = [l];
            return c(l) && a.push(l + 1), a
        };
        var e = function (a) {
            for (var b = 1; b <= m; b++) L.removeClass(p[b], "current", "prev", "next", "before", "after");
            if (L.addClass(p[a], "current"), c(a) && L.addClass(p[a + 1], "current"), 1 == a && (a = 0), a + 2 <= m && (L.addClass(p[a + 2], "next"), a + 3 <= m && L.addClass(p[a + 3], "next")), a - 1 > 0 && (L.addClass(p[a - 1], "prev"), a - 2 > 0 && L.addClass(p[a - 2], "prev")), a + 4 <= m) for (b = a + 4; b <= m; b++) L.addClass(p[b], "after");
            if (a - 3 > 0) for (b = a - 3; b > 0; b--) L.addClass(p[b], "before")
        };
        return d.updateLayout = function () {
            var d = c(l), e = J.getZoom(), f = Math.floor(g[l - 1][0] * e), h = d ? Math.floor(g[l][0] * e) : f,
                i = 2 * Math.max(f, h), j = Math.max(i, b.clientWidth - q), k = Math.floor(j / 2), n = k, o = k;
            x ? o -= h : n -= f;
            var r = Math.floor(g[l - 1][1] * e), s = d ? Math.floor(g[l][1] * e) : r,
                t = Math.max(r, s, b.clientHeight - q), u = Math.floor((t - (x ? s : r)) / 2),
                v = Math.floor((t - (x ? r : s)) / 2);
            a.style.width = j + "px", a.style.height = t + "px", p[1].style.marginLeft = o + "px", p[1].style.marginTop = v + "px";
            for (var w = 2; w <= m; w += 2) p[w].style.marginLeft = n + "px", p[w].style.marginTop = u + "px", w < m && (p[w + 1].style.marginLeft = o + "px", p[w + 1].style.marginTop = v + "px")
        }, d.isLastPage = function (a) {
            return a + (1 == a ? 1 : 2) > m
        }, d.getZoomBounds = function () {
            var a = c(l), b = Math.floor(g[l - 1][0]), d = a ? Math.floor(g[l][0]) : 0, e = Math.floor(g[l - 1][1]),
                f = a ? Math.floor(g[l][1]) : 0;
            return {width: 2 * Math.max(b, d), height: Math.max(e, f)}
        }, d.getAutoZoom = function (a, b) {
            return Math.min(a, b)
        }, d.next = function () {
            k.goToPage(l + (1 == l ? 1 : 2))
        }, d.prev = function () {
            k.goToPage(l - 1)
        }, d.toString = function () {
            return IDRViewer.LAYOUT_MAGAZINE
        }, d
    }(), E = function () {
        var a = {}, c = 0, d = 0, e = [];
        a.setup = function () {
            b.addEventListener("scroll", f);
            for (var a = 0; a < m; a++) g[a][0] > c && (c = g[a][0]), g[a][1] > d && (d = g[a][1])
        }, a.unload = function () {
            b.removeEventListener("scroll", f)
        };
        var f = function () {
            A.stopLoading(), h()
        }, h = function () {
            var a, b;
            if (p[1].getBoundingClientRect().top > 0) B(1); else for (a = 1; a <= m; a++) {
                var c = p[a].getBoundingClientRect();
                b = c.top;
                var d = c.bottom - c.top;
                if (b <= .25 * d && b > .5 * -d) {
                    B(a);
                    break
                }
            }
            i()
        }, i = function () {
            e = [l];
            var a, c, d = b.clientHeight, f = function (a) {
                return c = p[a].getBoundingClientRect(), c.bottom > 0 && c.top < d
            };
            for (a = l - 1; a >= 1 && f(a); a--) e.push(a);
            for (a = l + 1; a <= m && f(a); a++) e.push(a)
        };
        return a.goToPage = function (a, c) {
            var d = 0;
            if (c) {
                var e = c.split(" ");
                switch (e[0]) {
                    case"XYZ":
                        d = Number(e[2]);
                        break;
                    case"FitH":
                        d = Number(e[1]);
                        break;
                    case"FitR":
                        d = Number(e[4]);
                        break;
                    case"FitBH":
                        d = Number(e[1])
                }
                (isNaN(d) || d < 0 || d > g[a - 1][1]) && (d = 0), 0 !== d && (d = g[a - 1][1] - d)
            }
            var f = J.getZoom();
            b.scrollTop = p[a].offsetTop - q / 2 + d * f, B(a), i()
        }, a.getVisiblePages = function () {
            return e
        }, a.updateLayout = function () {
        }, a.isLastPage = function (a) {
            return a === m
        }, a.getZoomBounds = function () {
            return {width: c, height: d}
        }, a.getAutoZoom = function (c) {
            return a.getZoomBounds().width > b.clientWidth - q ? c : 1
        }, a.next = function () {
            k.goToPage(l + 1)
        }, a.prev = function () {
            k.goToPage(l - 1)
        }, a.toString = function () {
            return IDRViewer.LAYOUT_CONTINUOUS
        }, a
    }(), F = function () {
        var c = {}, d = 0, e = 0, f = [], h = 0, i = 0, j = 0, n = 0;
        return c.setup = function () {
            var a, f, j, k = 0, n = 0;
            b.addEventListener("touchstart", function (b) {
                l > 1 && (p[l - 1].style.transition = ""), p[l].style.transition = "", l < m && (p[l + 1].style.transition = ""), 1 === b.touches.length ? (a = Date.now(), f = b.touches[0].pageX, k = f, j = b.touches[0].pageY, n = j) : a = 0, A.stopLoading()
            }), b.addEventListener("touchmove", function (a) {
                if (1 === a.touches.length && document.documentElement.clientWidth === window.innerWidth) {
                    var c = a.touches[0].pageX, d = a.touches[0].pageY;
                    h = c - k + h, l > 1 && (p[l - 1].style.transform = "translate3D(" + (h - b.clientWidth) + "px, 0, 0)"), p[l].style.transform = "translate3D(" + h + "px, 0, 0)", l < m && (p[l + 1].style.transform = "translate3D(" + (h + b.clientWidth) + "px, 0, 0)"), k = c, n = d, a.preventDefault()
                }
                A.stopLoading()
            }), b.addEventListener("touchend", function (d) {
                var e;
                if (0 === d.touches.length && Date.now() - a < 300) {
                    var g = k - f, m = n - j;
                    Math.abs(g) > 100 && Math.abs(g) > .25 * Math.abs(m) && (e = g < 0 ? l + 1 : l - 1)
                }
                i += h, h = 0;
                var o = e ? e : Math.round(-i / b.clientWidth) + 1;
                c.goToPage(o)
            });
            for (var o = 0; o < m; o++) g[o][0] > d && (d = g[o][0]), g[o][1] > e && (e = g[o][1])
        }, c.unload = function () {
            a.style.width = "", a.style.height = ""
        }, c.goToPage = function (a) {
            a < 1 ? a = 1 : a > m && (a = m), i = -j * (a - 1);
            var b = a > l ? "right" : "left";
            if (p[a].style.transition = "0.5s", p[a].style.transform = "translate3D(0, 0, 0)", a === l) a > 1 && (p[a - 1].style.transition = "0.5s", p[a - 1].style.transform = "translate3D(" + -j + "px, 0, 0)"), a < m && (p[a + 1].style.transition = "0.5s", p[a + 1].style.transform = "translate3D(" + j + "px, 0, 0)"); else if ("right" === b) {
                p[l].style.transition = "0.5s", p[l].style.transform = "translate3D(" + -j + "px, 0, 0)", l > 1 && (p[l - 1].style.transition = "", p[l - 1].style.transform = "translate3D(" + -j + "px, 0, 0)");
                for (var c = l + 1; c < a; c++) p[c].style.transition = "", p[c].style.transform = "translate3D(" + -j + "px, 0, 0)"
            } else if ("left" === b) {
                p[l].style.transition = "0.5s", p[l].style.transform = "translate3D(" + j + "px, 0, 0)", l < m && (p[l + 1].style.transition = "", p[l + 1].style.transform = "translate3D(" + j + "px, 0, 0)");
                for (var d = l - 1; d > a; d--) p[d].style.transition = "", p[d].style.transform = "translate3D(" + j + "px, 0, 0)"
            }
            setTimeout(function () {
                A.stopLoading()
            }, 250), B(a), f = [l]
        }, c.getVisiblePages = function () {
            return f
        }, c.updateLayout = function () {
            var c = J.getZoom(), f = e * c, g = d * c, h = (j - g) / 2, i = (n - f) / 2;
            n = b.clientHeight, j = b.clientWidth;
            for (var k = 0; k < l; k++) p[k + 1].style.transform = "translate3D(" + -j + "px, 0, 0)", p[k + 1].style.top = i + "px", p[k + 1].style.left = h + "px", p[k + 1].style.position = "absolute";
            for (p[l].style.transform = "translate3D(0, 0, 0)", p[l].style.top = i + "px", p[l].style.left = h + "px", p[l].style.position = "absolute", k = l; k < m; k++) p[k + 1].style.transform = "translate3D(" + j + "px, 0, 0)", p[k + 1].style.top = i + "px", p[k + 1].style.left = h + "px", p[k + 1].style.position = "absolute";
            a.style.width = j + "px", a.style.height = n + "px"
        }, c.isLastPage = function (a) {
            return a === m
        }, c.getZoomBounds = function () {
            return {width: d, height: e}
        }, c.getAutoZoom = function (a, b) {
            return Math.min(a, b)
        }, c.next = function () {
            k.goToPage(l + 1)
        }, c.prev = function () {
            k.goToPage(l - 1)
        }, c.toString = function () {
            return w
        }, c
    }(), G = function (a) {
        try {
            a.getSelection ? a.getSelection().empty ? a.getSelection().empty() : a.getSelection().removeAllRanges && a.getSelection().removeAllRanges() : a.document.selection && a.document.selection.empty()
        } catch (b) {
        }
    }, H = function (b) {
        try {
            G(b);
            for (var c = a.children, d = 0; d < c.length; d++) A.getState(d + 1) === z.LOADED && G(c[d].firstChild.contentDocument)
        } catch (e) {
        }
    }, I = function () {
        var a, c, d, f = {}, g = !1;
        f.setup = function () {
            switch (d) {
                case IDRViewer.SELECT_PAN:
                case IDRViewer.SELECT_SELECT:
                    break;
                default:
                    d = IDRViewer.SELECT_SELECT
            }
            this.currentSelectMode = d, this.currentSelectMode == k.SELECT_SELECT ? f.enableTextSelection() : f.enablePanning()
        }, f.enableTextSelection = function () {
            this.currentSelectMode = k.SELECT_SELECT, L.removeClass(h, "panning"), h.removeEventListener("mousedown", i), document.removeEventListener("mouseup", j), h.removeEventListener("mousemove", l)
        };
        var i = function (b) {
            return b = b || window.event, L.addClass(h, "mousedown"), a = b.clientX, c = b.clientY, g = !0, !1
        }, j = function () {
            L.removeClass(h, "mousedown"), g = !1
        }, l = function (d) {
            if (g) return d = d || window.event, b.scrollLeft = b.scrollLeft + a - d.clientX, b.scrollTop = b.scrollTop + c - d.clientY, a = d.clientX, c = d.clientY, !1
        };
        return f.enablePanning = function () {
            this.currentSelectMode = k.SELECT_PAN, e ? H(window) : G(window), L.addClass(h, "panning"), h.addEventListener("mousedown", i), document.addEventListener("mouseup", j), h.addEventListener("mousemove", l)
        }, f.setDefaultMode = function (a) {
            d = a
        }, f
    }();
    k.setSelectMode = function (a) {
        if (s) {
            if (d) return;
            a == k.SELECT_SELECT ? I.enableTextSelection() : I.enablePanning(), k.fire("selectchange", {type: a})
        } else I.setDefaultMode(a)
    };
    var J = function () {
        var a, d, e, f = k.ZOOM_AUTO, h = [.25, .5, .75, 1, 1.25, 1.5, 2, 2.5, 3, 3.5, 4],
            i = [k.ZOOM_AUTO, k.ZOOM_FITPAGE, k.ZOOM_FITHEIGHT, k.ZOOM_FITWIDTH, k.ZOOM_ACTUALSIZE], j = 0, l = 1,
            n = function () {
                var a = document.createElement("style");
                a.setAttribute("type", "text/css"), document.head.appendChild(a), d = a.sheet
            }, r = function (a, b, c, d, e) {
                var f;
                return f = e ? "translate3d(" + b + "px, " + c + "px, 0) scale(" + d + ")" : "translateX(" + b + "px) translateY(" + c + "px) scale(" + d + ")", "-webkit-transform: " + f + ";\n-ms-transform: " + f + ";\ntransform: " + f + ";"
            }, s = function (e) {
                A.stopLoading(), l = v(e);
                var h = !1, i = !1;
                l >= 4 ? (l = 4, i = !0) : l <= .25 && (l = .25, h = !0);
                var n = b.scrollTop / b.scrollHeight;
                c.updateLayout();
                for (var q = c.getVisiblePages(), t = 1; t <= m; t++) q.indexOf(t) === -1 && o[t].hide();
                a && d.deleteRule(a);
                var u = r(null, 0, 0, l, !1);
                a = d.insertRule(".page-inner { \n" + u + "\n}", d.cssRules.length);
                for (var w = 0; w < m; w++) p[w + 1].style.width = Math.floor(g[w][0] * l) + "px", p[w + 1].style.height = Math.floor(g[w][1] * l) + "px";
                b.scrollTop = b.scrollHeight * n, j++, j % 2 === 1 && s(), k.fire("zoomchange", {
                    zoomType: f,
                    zoomValue: l,
                    isMinZoom: h,
                    isMaxZoom: i
                })
            }, t = function () {
                for (var a = l, b = h[h.length - 1], c = 0; c < h.length; c++) if (h[c] > a) {
                    b = h[c];
                    break
                }
                for (c = 0; c < i.length; c++) {
                    var d = v(i[c]);
                    if (d > a && d <= b) return i[c]
                }
                return b
            }, u = function () {
                for (var a = l, b = h[0], c = h.length - 1; c >= 0; c--) if (h[c] < a) {
                    b = h[c];
                    break
                }
                for (c = 0; c < i.length; c++) {
                    var d = v(i[c]);
                    if (d >= b && d < a) return i[c]
                }
                return b
            }, v = function (a) {
                var d = c.getZoomBounds(), e = (b.clientWidth - q) / d.width, g = (b.clientHeight - q) / d.height,
                    h = parseFloat(a);
                switch (isNaN(h) || (l = h, a = k.ZOOM_SPECIFIC), a || (a = f), a) {
                    case k.ZOOM_AUTO:
                        l = c.getAutoZoom(e, g);
                        break;
                    case k.ZOOM_FITWIDTH:
                        l = e;
                        break;
                    case k.ZOOM_FITHEIGHT:
                        l = g;
                        break;
                    case k.ZOOM_FITPAGE:
                        l = Math.min(e, g);
                        break;
                    case k.ZOOM_ACTUALSIZE:
                        l = 1
                }
                return f = a, l
            };
        return {
            setup: n, updateZoom: s, updateZoomToDefault: function () {
                s(e)
            }, zoomIn: function () {
                s(t())
            }, zoomOut: function () {
                s(u())
            }, getZoom: function () {
                return l
            }, setDefault: function (a) {
                e = a
            }
        }
    }();
    k.zoomIn = function () {
        J.zoomIn()
    }, k.zoomOut = function () {
        J.zoomOut()
    }, k.setZoom = function (a) {
        s ? J.updateZoom(a) : J.setDefault(a)
    }, k.goToPage = function (a, b) {
        s ? a >= 1 && a <= m && c.goToPage(Number(a), b) : l = a
    }, k.next = function () {
        c.next()
    }, k.prev = function () {
        c.prev()
    }, k.setLayout = function (a) {
        s ? (c.unload(), L.removeClass(b, "layout-" + c.toString()), a == k.LAYOUT_PRESENTATION ? c = C : a == k.LAYOUT_MAGAZINE ? c = D : a == k.LAYOUT_CONTINUOUS ? c = E : a == w && (c = F), c.setup(l), L.addClass(b, "layout-" + c.toString()), J.updateZoom(IDRViewer.ZOOM_AUTO), c.goToPage(l), k.fire("layoutchange", {layout: a})) : j = a
    }, k.updateLayout = function () {
        J.updateZoom()
    };
    var K = function (a) {
        return document.getElementById(a)
    };
    k.on = function (a, b) {
        r[a] || (r[a] = []), r[a].indexOf(b) === -1 && r[a].push(b)
    }, k.off = function (a, b) {
        if (r[a]) {
            var c = r[a].indexOf(b);
            c !== -1 && r[a].splice(c, 1)
        }
    }, k.fire = function (a, b) {
        r[a] && r[a].forEach(function (a) {
            a(b)
        })
    };
    var L = function () {
        return {
            addClass: function (a, b) {
                var c = 0 !== a.className.length ? a.className.split(" ") : [], d = c.indexOf(b);
                d === -1 && (c.push(b), a.className = c.join(" "))
            }, removeClass: function () {
                for (var a = arguments[0], b = 0 !== a.className.length ? a.className.split(" ") : [], c = 1; c < arguments.length; c++) {
                    var d = b.indexOf(arguments[c]);
                    d !== -1 && b.splice(d, 1)
                }
                a.className = b.join(" ")
            }
        }
    }();
    "function" == typeof define && define.amd ? define(["idrviewer"], [], function () {
        return k
    }) : "object" == typeof module && module.exports ? module.exports = k : window.IDRViewer = k
}();