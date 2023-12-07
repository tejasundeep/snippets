// Find screen size
class ScreenSize {
    constructor() {
        this.cssVariables = {
            "--device-type": "",
            "--container": "",
        };
        this.updateDeviceType();
        window.addEventListener("resize", this.debounce(this.updateDeviceType.bind(this), 300)); // Debounce the resize event
    }

    setCssVariables(variables) {
        const styleSheet = new CSSStyleSheet();
        styleSheet.replaceSync(`:root { ${Object.entries(variables)
            .map(([key, value]) => `${key}: ${value};`)
            .join(" ")} }`);
        document.adoptedStyleSheets = [styleSheet];
    }

    getDeviceTypeAndContainer() {
        const width = window.innerWidth;
        if (width < 576) return { deviceType: "xs", container: "100%" };
        else if (width < 768) return { deviceType: "sm", container: "540px" };
        else if (width < 992) return { deviceType: "md", container: "720px" };
        else if (width < 1200) return { deviceType: "lg", container: "960px" };
        else if (width < 1400) return { deviceType: "xl", container: "1140px" };
        else return { deviceType: "xxl", container: "1320px" };
    }

    updateDeviceType() {
        const { deviceType, container } = this.getDeviceTypeAndContainer();
        this.setCssVariables({
            "--device-type": deviceType,
            "--container": container,
        });
    }

    debounce(func, delay) {
        let timeout;
        return function () {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, delay);
        };
    }
}

// Space manager (Margins and Paddings)
class SpaceManager {
    constructor() {
        this.processedClassNames = new Set();
        this.cssPropertyMap = {
            'm': 'margin',
            'mt': 'margin-top',
            'mb': 'margin-bottom',
            'ml': 'margin-left',
            'mr': 'margin-right',
            'mx': 'margin-horizontal',
            'my': 'margin-vertical',
            'p': 'padding',
            'pt': 'padding-top',
            'pb': 'padding-bottom',
            'pl': 'padding-left',
            'pr': 'padding-right',
            'px': 'padding-horizontal',
            'py': 'padding-vertical'
        };
        this.observeDomChanges();
    }

    calculateSpaceValue(input) {
        const match = input.match(/([mp][trblxy]?)-(\d+)(n)?/);
        if (!match) return null;

        const [_, styleType, number, negativeFlag] = match;
        const multiplier = negativeFlag === 'n' ? -1 : 1;
        const styleValue = (parseInt(number, 10) * 0.25 * multiplier).toFixed(2);
        return { styleType, styleValue };
    }

    applyStyles() {
        const elementsWithClasses = document.querySelectorAll('[class*="-"]');
        let spaceStyles = '';

        elementsWithClasses.forEach(element => {
            element.classList.forEach(className => {
                if (this.processedClassNames.has(className)) return;

                const styleDetails = this.calculateSpaceValue(className);
                if (!styleDetails) return;

                let cssProperty = this.cssPropertyMap[styleDetails.styleType];
                if (cssProperty) {
                    if (cssProperty === 'margin-horizontal' || cssProperty === 'padding-horizontal') {
                        spaceStyles += `.${className} { ${cssProperty.replace('-horizontal', '-left')}: ${styleDetails.styleValue}rem; ${cssProperty.replace('-horizontal', '-right')}: ${styleDetails.styleValue}rem; }\n`;
                    } else if (cssProperty === 'margin-vertical' || cssProperty === 'padding-vertical') {
                        spaceStyles += `.${className} { ${cssProperty.replace('-vertical', '-top')}: ${styleDetails.styleValue}rem; ${cssProperty.replace('-vertical', '-bottom')}: ${styleDetails.styleValue}rem; }\n`;
                    } else {
                        spaceStyles += `.${className} { ${cssProperty}: ${styleDetails.styleValue}rem; }\n`;
                    }
                    this.processedClassNames.add(className);
                }
            });
        });

        if (spaceStyles) {
            const styleSheet = new CSSStyleSheet();
            styleSheet.replaceSync(spaceStyles);
            document.adoptedStyleSheets = [...document.adoptedStyleSheets, styleSheet];
        }
    }

    observeDomChanges() {
        const observer = new MutationObserver(this.throttle(this.applyStyles.bind(this), 300)); // Throttle style updates
        observer.observe(document.body, {
            attributes: true,
            childList: true,
            subtree: true
        });
    }

    throttle(func, delay) {
        let lastExecTime = 0;
        return function () {
            const context = this;
            const args = arguments;
            const currentTime = Date.now();
            if (currentTime - lastExecTime >= delay) {
                func.apply(context, args);
                lastExecTime = currentTime;
            }
        };
    }
}

// Z-Index
class ZIndexManager {
    constructor() {
        this.processedClasses = new Set();
        this.styleSheet = new CSSStyleSheet();
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, this.styleSheet];
        this.initiateDomObserver();
        this.applyZIndexStyles();
    }

    calculateZIndex(className) {
        const regex = /z-(\d+)(n)?/;
        const match = className.match(regex);

        if (match) {
            const [_, number, isNegative] = match;
            const multiplier = isNegative === 'n' ? -1 : 1;
            return parseInt(number, 10) * multiplier;
        }

        return null;
    }

    applyZIndexStyles() {
        const elements = document.querySelectorAll('[class*="z-"]');
        let styles = "";

        elements.forEach(element => {
            element.classList.forEach(className => {
                if (!this.processedClasses.has(className)) {
                    const zIndex = this.calculateZIndex(className);
                    if (zIndex !== null) {
                        styles += `.${className} { z-index: ${zIndex}; }\n`;
                        this.processedClasses.add(className);
                    }
                }
            });
        });

        if (styles) {
            this.styleSheet.replaceSync(styles);
        }
    }

    initiateDomObserver() {
        const observer = new MutationObserver(() => this.applyZIndexStyles());
        observer.observe(document.body, {
            attributes: true,
            childList: true,
            subtree: true,
        });
    }
}

// Opacity
class OpacityManager {
    constructor() {
        this.processedClasses = new Set();
        this.styleSheet = new CSSStyleSheet();
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, this.styleSheet];
        this.applyInitialOpacityStyles();
        this.initiateDomObserver();
    }

    calculateOpacity(className) {
        const regex = /opacity-(\d+)/;
        const match = className.match(regex);

        if (match) {
            const opacityLevel = parseInt(match[1], 10);
            return opacityLevel >= 1 && opacityLevel <= 10 ? opacityLevel / 10 : null;
        }

        return null;
    }

    applyInitialOpacityStyles() {
        const elements = document.querySelectorAll('[class*="opacity-"]');
        elements.forEach(element => {
            element.classList.forEach(className => {
                this.addOpacityStyle(className);
            });
        });
    }

    addOpacityStyle(className) {
        if (!this.processedClasses.has(className) && className.startsWith('opacity-')) {
            const opacity = this.calculateOpacity(className);
            if (opacity !== null) {
                this.styleSheet.insertRule(`.${className} { opacity: ${opacity}; }`, this.styleSheet.cssRules.length);
                this.processedClasses.add(className);
            }
        }
    }

    initiateDomObserver() {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const newClassNames = mutation.target.className.split(/\s+/);
                    newClassNames.forEach(className => this.addOpacityStyle(className));
                }
            });
        });

        observer.observe(document.body, {
            attributes: true,
            childList: true,
            subtree: true,
            attributeFilter: ['class'],
        });
    }
}

// Border radius
class BorderRadiusManager {
    constructor() {
        this.processedClasses = new Set();
        this.styleSheet = new CSSStyleSheet();
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, this.styleSheet];
        this.initiateDomObserver();
        this.applyBorderRadiusStyles();
    }

    calculateBorderRadius(className) {
        const regex = /rounded-(\d+)/;
        const match = className.match(regex);

        if (match) {
            const [, radius] = match;
            return parseInt(radius, 10);
        }

        return null;
    }

    applyBorderRadiusStyles() {
        const elements = document.querySelectorAll('[class*="rounded-"]');
        let styles = "";

        elements.forEach(element => {
            element.classList.forEach(className => {
                if (!this.processedClasses.has(className)) {
                    const borderRadius = this.calculateBorderRadius(className);
                    if (borderRadius !== null) {
                        styles += `.${className} { border-radius: ${borderRadius}px; }\n`;
                        this.processedClasses.add(className);
                    }
                }
            });
        });

        if (styles) {
            this.styleSheet.replaceSync(styles);
        }
    }

    initiateDomObserver() {
        const observer = new MutationObserver(() => this.applyBorderRadiusStyles());
        observer.observe(document.body, {
            attributes: true,
            childList: true,
            subtree: true,
        });
    }
}

// Font size
class FontSizeManager {
    constructor() {
        this.processedClasses = new Set();
        this.styleSheet = new CSSStyleSheet();
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, this.styleSheet];
        this.initiateDomObserver();
    }

    calculateFontSize(className) {
        const regex = /fs-(\d+)/;
        const match = className.match(regex);
        return match ? parseInt(match[1], 10) : null;
    }

    applyFontSizeStyles() {
        const elements = document.querySelectorAll('[class*="fs-"]');
        const styles = Array.from(elements).reduce((acc, element) => {
            Array.from(element.classList).forEach((className) => {
                if (!this.processedClasses.has(className)) {
                    const fontSize = this.calculateFontSize(className);
                    if (fontSize !== null) {
                        acc.push(`.${className} { font-size: ${fontSize}px; }`);
                        this.processedClasses.add(className);
                    }
                }
            });
            return acc;
        }, []);

        if (styles.length > 0) {
            this.styleSheet.replaceSync(styles.join('\n'));
        }
    }

    initiateDomObserver() {
        const observer = new MutationObserver(() => this.applyFontSizeStyles());
        observer.observe(document.body, {
            attributes: true,
            childList: true,
            subtree: true,
        });
    }
}

class CSSManager {
    constructor() {
        this.screenSize = new ScreenSize();
        this.spaceManager = new SpaceManager();
        this.zIndexManager = new ZIndexManager();
        this.opacityManager = new OpacityManager();
        this.borderRadiusManager = new BorderRadiusManager();
        this.fontSizeManager = new FontSizeManager();
        this.observeDomChanges();
    }

    observeDomChanges() {
        this.spaceManager.observeDomChanges();
        this.zIndexManager.initiateDomObserver();
        this.opacityManager.initiateDomObserver();
        this.borderRadiusManager.initiateDomObserver();
        this.fontSizeManager.initiateDomObserver();
    }
}

const cssManager = new CSSManager();
cssManager.observeDomChanges();
