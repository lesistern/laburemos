/**
 * Performance Manager
 * LaburAR UX Optimization - Enterprise Grade
 * 
 * Comprehensive performance monitoring, optimization,
 * and Web Vitals tracking for Fiverr-level performance
 * 
 * @author LaburAR Performance Team
 * @version 2.0
 * @since 2025-07-20
 */

class PerformanceManager {
    constructor() {
        this.metrics = {
            pageLoadStart: performance.now(),
            contentLoadTime: null,
            interactiveTime: null,
            firstContentfulPaint: null,
            largestContentfulPaint: null,
            cumulativeLayoutShift: 0,
            firstInputDelay: null,
            timeToFirstByte: null,
            navigationTiming: null
        };
        
        this.observers = new Map();
        this.resourceCache = new Map();
        this.imageLoadQueue = [];
        this.performanceEntries = [];
        this.vitalsReported = false;
        
        // Performance thresholds (Fiverr-level targets)
        this.thresholds = {
            contentLoadTime: 3000, // 3 seconds
            firstContentfulPaint: 1800, // 1.8 seconds
            largestContentfulPaint: 2500, // 2.5 seconds
            cumulativeLayoutShift: 0.1, // 0.1 CLS score
            firstInputDelay: 100, // 100ms
            timeToFirstByte: 600 // 600ms
        };
        
        this.init();
    }
    
    init() {
        this.observeWebVitals();
        this.observeNetworkInformation();
        this.setupLazyLoading();
        this.setupResourceOptimization();
        this.setupInfiniteScroll();
        this.monitorPerformance();
        this.setupMemoryMonitoring();
        this.trackNavigationTiming();
        
        // Start performance monitoring
        this.startPerformanceTracking();
        
        console.log('PerformanceManager initialized - monitoring Web Vitals');
    }
    
    // === WEB VITALS MONITORING ===
    observeWebVitals() {
        if (!('PerformanceObserver' in window)) {
            console.warn('PerformanceObserver not supported');
            return;
        }
        
        try {
            // Largest Contentful Paint (LCP)
            const lcpObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.metrics.largestContentfulPaint = lastEntry.startTime;
                this.checkLCPThreshold(lastEntry.startTime);
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            this.observers.set('lcp', lcpObserver);
            
            // Cumulative Layout Shift (CLS)
            let clsValue = 0;
            const clsObserver = new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                }
                this.metrics.cumulativeLayoutShift = clsValue;
                this.checkCLSThreshold(clsValue);
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });
            this.observers.set('cls', clsObserver);
            
            // First Contentful Paint (FCP)
            const fcpObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
                if (fcpEntry) {
                    this.metrics.firstContentfulPaint = fcpEntry.startTime;
                    this.checkFCPThreshold(fcpEntry.startTime);
                }
            });
            fcpObserver.observe({ entryTypes: ['paint'] });
            this.observers.set('fcp', fcpObserver);
            
            // First Input Delay (FID)
            const fidObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                entries.forEach(entry => {
                    this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
                    this.checkFIDThreshold(this.metrics.firstInputDelay);
                });
            });
            fidObserver.observe({ entryTypes: ['first-input'] });
            this.observers.set('fid', fidObserver);
            
            // Long Tasks
            const longTaskObserver = new PerformanceObserver((entryList) => {
                entryList.getEntries().forEach(entry => {
                    if (entry.duration > 50) {
                        console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms`);
                        this.reportLongTask(entry);
                    }
                });
            });
            longTaskObserver.observe({ entryTypes: ['longtask'] });
            this.observers.set('longTask', longTaskObserver);
            
        } catch (e) {
            console.warn('Error setting up Web Vitals observers:', e);
        }
        
        // Navigation timing
        window.addEventListener('load', () => {
            this.metrics.contentLoadTime = performance.now() - this.metrics.pageLoadStart;
            this.processNavigationTiming();
            
            // Report final metrics after a delay to ensure all are captured
            setTimeout(() => {
                this.reportFinalMetrics();
            }, 1000);
        });
        
        // Interactive timing
        document.addEventListener('DOMContentLoaded', () => {
            this.metrics.interactiveTime = performance.now() - this.metrics.pageLoadStart;
        });
    }
    
    // === NETWORK INFORMATION ===
    observeNetworkInformation() {
        if ('connection' in navigator) {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            
            if (connection) {
                this.adaptToNetworkConditions(connection);
                
                // Listen for network changes
                connection.addEventListener('change', () => {
                    this.adaptToNetworkConditions(connection);
                });
            }
        }
    }
    
    adaptToNetworkConditions(connection) {
        const { effectiveType, downlink, rtt } = connection;
        
        console.log(`Network: ${effectiveType}, Downlink: ${downlink}Mbps, RTT: ${rtt}ms`);
        
        // Adjust loading strategies based on network
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
            this.enableLowBandwidthMode();
        } else if (effectiveType === '3g') {
            this.enableMediumBandwidthMode();
        } else {
            this.enableHighBandwidthMode();
        }
        
        // Update image quality based on network
        this.adjustImageQuality(connection);
    }
    
    enableLowBandwidthMode() {
        console.log('Enabling low bandwidth mode');
        
        // Disable auto-playing videos
        document.querySelectorAll('video[autoplay]').forEach(video => {
            video.autoplay = false;
        });
        
        // Use lower quality images
        document.documentElement.setAttribute('data-bandwidth', 'low');
        
        // Reduce animation complexity
        document.documentElement.style.setProperty('--animation-duration', '0.1s');
    }
    
    enableMediumBandwidthMode() {
        console.log('Enabling medium bandwidth mode');
        document.documentElement.setAttribute('data-bandwidth', 'medium');
        document.documentElement.style.setProperty('--animation-duration', '0.2s');
    }
    
    enableHighBandwidthMode() {
        console.log('Enabling high bandwidth mode');
        document.documentElement.setAttribute('data-bandwidth', 'high');
        document.documentElement.style.setProperty('--animation-duration', '0.3s');
    }
    
    // === LAZY LOADING OPTIMIZATION ===
    setupLazyLoading() {
        if (!('IntersectionObserver' in window)) {
            // Fallback for browsers without IntersectionObserver
            this.fallbackLazyLoading();
            return;
        }
        
        const lazyImageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    lazyImageObserver.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });
        
        // Observe all lazy images
        document.querySelectorAll('img[data-src]').forEach(img => {
            lazyImageObserver.observe(img);
            
            // Add loading placeholder
            if (!img.src) {
                img.src = this.generatePlaceholder(img);
            }
        });
        
        this.observers.set('lazyImages', lazyImageObserver);
        
        // Also handle background images
        this.setupBackgroundLazyLoading();
    }
    
    setupBackgroundLazyLoading() {
        const bgObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const bgImage = element.dataset.bgSrc;
                    if (bgImage) {
                        element.style.backgroundImage = `url(${bgImage})`;
                        element.classList.add('bg-loaded');
                    }
                    bgObserver.unobserve(element);
                }
            });
        }, {
            rootMargin: '50px 0px'
        });
        
        document.querySelectorAll('[data-bg-src]').forEach(el => {
            bgObserver.observe(el);
        });
        
        this.observers.set('backgroundImages', bgObserver);
    }
    
    generatePlaceholder(img) {
        const width = img.getAttribute('width') || 300;
        const height = img.getAttribute('height') || 200;
        
        // Generate a simple SVG placeholder
        return `data:image/svg+xml,${encodeURIComponent(`
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#f3f4f6"/>
                <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="Inter, sans-serif" font-size="14">
                    Cargando...
                </text>
            </svg>
        `)}`;
    }
    
    loadImage(img) {
        return new Promise((resolve, reject) => {
            const imageUrl = img.dataset.src;
            
            if (!imageUrl) {
                resolve();
                return;
            }
            
            // Check cache first
            if (this.resourceCache.has(imageUrl)) {
                img.src = imageUrl;
                img.classList.remove('lazy', 'loading');
                img.classList.add('loaded');
                resolve();
                return;
            }
            
            // Create new image to preload
            const newImage = new Image();
            
            newImage.onload = () => {
                // Cache the loaded image
                this.resourceCache.set(imageUrl, true);
                
                // Apply to actual img element with fade-in effect
                img.style.opacity = '0';
                img.src = imageUrl;
                img.classList.remove('lazy', 'loading');
                img.classList.add('loaded');
                
                // Fade in effect
                requestAnimationFrame(() => {
                    img.style.transition = 'opacity 0.3s ease';
                    img.style.opacity = '1';
                });
                
                resolve();
            };
            
            newImage.onerror = () => {
                console.error(`Failed to load image: ${imageUrl}`);
                img.classList.add('error');
                img.classList.remove('loading');
                reject();
            };
            
            // Show loading state
            img.classList.add('loading');
            
            // Start loading
            newImage.src = imageUrl;
        });
    }
    
    fallbackLazyLoading() {
        document.querySelectorAll('img[data-src]').forEach(img => {
            this.loadImage(img);
        });
    }
    
    // === RESOURCE OPTIMIZATION ===
    setupResourceOptimization() {
        this.preloadCriticalResources();
        this.setupResourceHints();
        this.optimizeFonts();
        this.setupServiceWorker();
    }
    
    preloadCriticalResources() {
        const criticalResources = [
            { href: '/Laburar/assets/css/main.css', as: 'style' },
            { href: '/Laburar/assets/css/design-system-pro.css', as: 'style' },
            { href: '/Laburar/assets/js/main.js', as: 'script' }
        ];
        
        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource.href;
            link.as = resource.as;
            
            if (resource.as === 'style') {
                link.onload = () => {
                    // Convert to stylesheet after load
                    link.rel = 'stylesheet';
                };
            }
            
            document.head.appendChild(link);
        });
    }
    
    setupResourceHints() {
        const externalDomains = [
            'fonts.googleapis.com',
            'fonts.gstatic.com',
            'api.mercadopago.com',
            'www.google-analytics.com'
        ];
        
        externalDomains.forEach(domain => {
            // DNS prefetch
            const dnsLink = document.createElement('link');
            dnsLink.rel = 'dns-prefetch';
            dnsLink.href = `//${domain}`;
            document.head.appendChild(dnsLink);
            
            // Preconnect for critical domains
            if (domain.includes('fonts') || domain.includes('mercadopago')) {
                const connectLink = document.createElement('link');
                connectLink.rel = 'preconnect';
                connectLink.href = `https://${domain}`;
                connectLink.crossOrigin = 'anonymous';
                document.head.appendChild(connectLink);
            }
        });
    }
    
    optimizeFonts() {
        // Add font-display: swap to existing font links
        document.querySelectorAll('link[href*="fonts.googleapis.com"]').forEach(link => {
            if (!link.href.includes('display=swap')) {
                link.href += link.href.includes('?') ? '&display=swap' : '?display=swap';
            }
        });
        
        // Preload important font files
        const fontFiles = [
            '/Laburar/assets/fonts/Inter-Regular.woff2',
            '/Laburar/assets/fonts/Inter-Medium.woff2',
            '/Laburar/assets/fonts/Inter-SemiBold.woff2'
        ];
        
        fontFiles.forEach(font => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = font;
            link.as = 'font';
            link.type = 'font/woff2';
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });
    }
    
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/Laburar/sw.js')
                    .then(registration => {
                        console.log('ServiceWorker registered successfully');
                    })
                    .catch(error => {
                        console.log('ServiceWorker registration failed:', error);
                    });
            });
        }
    }
    
    // === INFINITE SCROLL OPTIMIZATION ===
    setupInfiniteScroll() {
        const infiniteScrollContainers = document.querySelectorAll('[data-infinite-scroll]');
        
        infiniteScrollContainers.forEach(container => {
            if (!('IntersectionObserver' in window)) {
                // Fallback: disable infinite scroll
                console.warn('IntersectionObserver not supported, infinite scroll disabled');
                return;
            }
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadMoreContent(container);
                    }
                });
            }, {
                rootMargin: '100px',
                threshold: 0.1
            });
            
            const trigger = container.querySelector('[data-infinite-trigger]');
            if (trigger) {
                observer.observe(trigger);
                this.observers.set(`infinite-${container.id}`, observer);
            }
        });
    }
    
    async loadMoreContent(container) {
        const url = container.dataset.infiniteUrl;
        const page = parseInt(container.dataset.currentPage || '1') + 1;
        
        if (!url || container.dataset.loading === 'true' || container.dataset.hasMore === 'false') {
            return;
        }
        
        // Set loading state
        container.dataset.loading = 'true';
        this.showInfiniteLoader(container);
        
        try {
            const startTime = performance.now();
            
            const response = await fetch(`${url}?page=${page}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                }
            });
            
            const loadTime = performance.now() - startTime;
            console.log(`Infinite scroll load time: ${loadTime.toFixed(2)}ms`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.data.items.length > 0) {
                // Append new content with animation
                await this.appendInfiniteContent(container, data.data.items);
                
                // Update state
                container.dataset.currentPage = page.toString();
                container.dataset.hasMore = data.data.hasMore ? 'true' : 'false';
                
                // Setup lazy loading for new images
                this.setupLazyLoadingForContainer(container);
                
            } else {
                container.dataset.hasMore = 'false';
            }
            
        } catch (error) {
            console.error('Infinite scroll error:', error);
            this.showInfiniteError(container);
        } finally {
            container.dataset.loading = 'false';
            this.hideInfiniteLoader(container);
        }
    }
    
    appendInfiniteContent(container, items) {
        return new Promise(resolve => {
            const contentContainer = container.querySelector('[data-infinite-content]');
            if (!contentContainer) {
                resolve();
                return;
            }
            
            const fragment = document.createDocumentFragment();
            
            items.forEach((item, index) => {
                const element = this.createItemElement(item, container.dataset.itemTemplate);
                
                // Add stagger animation
                element.style.opacity = '0';
                element.style.transform = 'translateY(20px)';
                element.style.transition = 'all 0.3s ease';
                element.style.transitionDelay = `${index * 0.1}s`;
                
                fragment.appendChild(element);
            });
            
            // Use requestAnimationFrame for smooth insertion
            requestAnimationFrame(() => {
                contentContainer.appendChild(fragment);
                
                // Trigger animations
                requestAnimationFrame(() => {
                    items.forEach((_, index) => {
                        const element = fragment.children[index];
                        if (element) {
                            element.style.opacity = '1';
                            element.style.transform = 'translateY(0)';
                        }
                    });
                });
                
                resolve();
            });
        });
    }
    
    showInfiniteLoader(container) {
        const loader = container.querySelector('.infinite-scroll-loading');
        if (loader) {
            loader.style.display = 'flex';
        }
    }
    
    hideInfiniteLoader(container) {
        const loader = container.querySelector('.infinite-scroll-loading');
        if (loader) {
            loader.style.display = 'none';
        }
    }
    
    // === MEMORY MONITORING ===
    setupMemoryMonitoring() {
        if (!performance.memory) return;
        
        setInterval(() => {
            const memoryInfo = {
                used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
                total: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) // MB
            };
            
            // Warn if memory usage is high
            if (memoryInfo.used > memoryInfo.limit * 0.9) {
                console.warn('High memory usage detected:', memoryInfo);
                this.optimizeMemory();
            }
            
            // Store memory info for reporting
            this.metrics.memoryUsage = memoryInfo;
            
        }, 30000); // Check every 30 seconds
    }
    
    optimizeMemory() {
        // Clear old cache entries
        if (this.resourceCache.size > 100) {
            this.resourceCache.clear();
            console.log('Resource cache cleared to optimize memory');
        }
        
        // Disconnect inactive observers
        this.observers.forEach((observer, key) => {
            if (key.startsWith('infinite-')) {
                const container = document.getElementById(key.replace('infinite-', ''));
                if (!container || !container.isConnected) {
                    observer.disconnect();
                    this.observers.delete(key);
                }
            }
        });
        
        // Suggest garbage collection (if available)
        if (window.gc) {
            window.gc();
        }
    }
    
    // === PERFORMANCE MONITORING ===
    monitorPerformance() {
        // Track long tasks
        if ('PerformanceObserver' in window) {
            try {
                const longTaskObserver = new PerformanceObserver((entryList) => {
                    entryList.getEntries().forEach(entry => {
                        if (entry.duration > 50) {
                            console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms`);
                            this.reportLongTask(entry);
                        }
                    });
                });
                longTaskObserver.observe({ entryTypes: ['longtask'] });
                this.observers.set('longTaskMonitor', longTaskObserver);
            } catch (e) {
                console.warn('Long task observer not supported');
            }
        }
        
        // Monitor frame rate
        this.monitorFrameRate();
        
        // Track resource timing
        this.trackResourceTiming();
    }
    
    monitorFrameRate() {
        let lastTime = performance.now();
        let frameCount = 0;
        let fps = 0;
        
        const countFrames = (currentTime) => {
            frameCount++;
            
            if (currentTime - lastTime >= 1000) {
                fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                
                if (fps < 30) {
                    console.warn(`Low FPS detected: ${fps}`);
                }
                
                this.metrics.fps = fps;
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(countFrames);
        };
        
        requestAnimationFrame(countFrames);
    }
    
    trackResourceTiming() {
        window.addEventListener('load', () => {
            const resources = performance.getEntriesByType('resource');
            
            resources.forEach(resource => {
                // Track slow loading resources
                if (resource.responseEnd - resource.startTime > 2000) {
                    console.warn(`Slow resource: ${resource.name} (${(resource.responseEnd - resource.startTime).toFixed(2)}ms)`);
                }
            });
            
            this.metrics.resourceTiming = resources;
        });
    }
    
    trackNavigationTiming() {
        window.addEventListener('load', () => {
            const navigation = performance.getEntriesByType('navigation')[0];
            if (navigation) {
                this.metrics.navigationTiming = navigation;
                this.metrics.timeToFirstByte = navigation.responseStart - navigation.requestStart;
            }
        });
    }
    
    // === THRESHOLD CHECKS ===
    checkLCPThreshold(value) {
        if (value > this.thresholds.largestContentfulPaint) {
            console.warn(`LCP threshold exceeded: ${value.toFixed(2)}ms (target: ${this.thresholds.largestContentfulPaint}ms)`);
        }
    }
    
    checkFCPThreshold(value) {
        if (value > this.thresholds.firstContentfulPaint) {
            console.warn(`FCP threshold exceeded: ${value.toFixed(2)}ms (target: ${this.thresholds.firstContentfulPaint}ms)`);
        }
    }
    
    checkCLSThreshold(value) {
        if (value > this.thresholds.cumulativeLayoutShift) {
            console.warn(`CLS threshold exceeded: ${value.toFixed(3)} (target: ${this.thresholds.cumulativeLayoutShift})`);
        }
    }
    
    checkFIDThreshold(value) {
        if (value > this.thresholds.firstInputDelay) {
            console.warn(`FID threshold exceeded: ${value.toFixed(2)}ms (target: ${this.thresholds.firstInputDelay}ms)`);
        }
    }
    
    // === REPORTING ===
    reportFinalMetrics() {
        if (this.vitalsReported) return;
        this.vitalsReported = true;
        
        const report = {
            ...this.metrics,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt,
                saveData: navigator.connection.saveData
            } : null,
            deviceMemory: navigator.deviceMemory || null,
            hardwareConcurrency: navigator.hardwareConcurrency || null
        };
        
        // Log comprehensive performance report
        this.logPerformanceReport(report);
        
        // Send to analytics if available
        if (window.analytics) {
            window.analytics.track('Performance Metrics', report);
        }
        
        // Send to performance monitoring service
        this.sendToPerformanceService(report);
        
        // Check all performance thresholds
        this.checkAllThresholds(report);
    }
    
    logPerformanceReport(report) {
        console.group('🚀 LaburAR Performance Report');
        
        if (report.contentLoadTime) {
            console.log(`📄 Content Load Time: ${(report.contentLoadTime / 1000).toFixed(2)}s`);
        }
        
        if (report.interactiveTime) {
            console.log(`⚡ Interactive Time: ${(report.interactiveTime / 1000).toFixed(2)}s`);
        }
        
        if (report.firstContentfulPaint) {
            console.log(`🎨 First Contentful Paint: ${(report.firstContentfulPaint / 1000).toFixed(2)}s`);
        }
        
        if (report.largestContentfulPaint) {
            console.log(`🖼️  Largest Contentful Paint: ${(report.largestContentfulPaint / 1000).toFixed(2)}s`);
        }
        
        if (report.cumulativeLayoutShift !== null) {
            console.log(`📐 Cumulative Layout Shift: ${report.cumulativeLayoutShift.toFixed(3)}`);
        }
        
        if (report.firstInputDelay) {
            console.log(`👆 First Input Delay: ${report.firstInputDelay.toFixed(2)}ms`);
        }
        
        if (report.timeToFirstByte) {
            console.log(`⏱️  Time to First Byte: ${report.timeToFirstByte.toFixed(2)}ms`);
        }
        
        if (report.fps) {
            console.log(`🎬 Frame Rate: ${report.fps} FPS`);
        }
        
        if (report.memoryUsage) {
            console.log(`💾 Memory Usage: ${report.memoryUsage.used}MB / ${report.memoryUsage.limit}MB`);
        }
        
        console.groupEnd();
    }
    
    sendToPerformanceService(report) {
        // Send to performance monitoring endpoint
        fetch('/Laburar/api/performance-metrics.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(report)
        }).catch(error => {
            console.warn('Failed to send performance metrics:', error);
        });
    }
    
    checkAllThresholds(report) {
        const issues = [];
        
        if (report.contentLoadTime && report.contentLoadTime > this.thresholds.contentLoadTime) {
            issues.push(`❌ Slow content load: ${(report.contentLoadTime / 1000).toFixed(2)}s`);
        }
        
        if (report.firstContentfulPaint && report.firstContentfulPaint > this.thresholds.firstContentfulPaint) {
            issues.push(`❌ Slow FCP: ${(report.firstContentfulPaint / 1000).toFixed(2)}s`);
        }
        
        if (report.largestContentfulPaint && report.largestContentfulPaint > this.thresholds.largestContentfulPaint) {
            issues.push(`❌ Slow LCP: ${(report.largestContentfulPaint / 1000).toFixed(2)}s`);
        }
        
        if (report.cumulativeLayoutShift && report.cumulativeLayoutShift > this.thresholds.cumulativeLayoutShift) {
            issues.push(`❌ High CLS: ${report.cumulativeLayoutShift.toFixed(3)}`);
        }
        
        if (report.firstInputDelay && report.firstInputDelay > this.thresholds.firstInputDelay) {
            issues.push(`❌ High FID: ${report.firstInputDelay.toFixed(2)}ms`);
        }
        
        if (issues.length > 0) {
            console.warn('⚠️  Performance issues detected:', issues);
            this.suggestOptimizations(issues);
        } else {
            console.log('✅ All performance thresholds met!');
        }
    }
    
    suggestOptimizations(issues) {
        console.group('💡 Performance Optimization Suggestions');
        
        issues.forEach(issue => {
            if (issue.includes('content load')) {
                console.log('• Consider code splitting and lazy loading more resources');
            } else if (issue.includes('FCP') || issue.includes('LCP')) {
                console.log('• Optimize critical rendering path and reduce render-blocking resources');
            } else if (issue.includes('CLS')) {
                console.log('• Add size attributes to images and reserve space for dynamic content');
            } else if (issue.includes('FID')) {
                console.log('• Reduce JavaScript execution time and use web workers for heavy tasks');
            }
        });
        
        console.groupEnd();
    }
    
    // === PUBLIC METHODS ===
    
    // Get current performance metrics
    getMetrics() {
        return { ...this.metrics };
    }
    
    // Get performance score (0-100)
    getPerformanceScore() {
        let score = 100;
        
        // Deduct points for threshold violations
        Object.keys(this.thresholds).forEach(metric => {
            if (this.metrics[metric] !== null && this.metrics[metric] !== undefined) {
                if (this.metrics[metric] > this.thresholds[metric]) {
                    score -= 15; // Deduct 15 points per violation
                }
            }
        });
        
        return Math.max(0, score);
    }
    
    // Force metrics report
    forceReport() {
        this.reportFinalMetrics();
    }
    
    // Update image quality based on network
    adjustImageQuality(connection) {
        const quality = connection.effectiveType === '4g' ? 'high' : 
                      connection.effectiveType === '3g' ? 'medium' : 'low';
        
        document.documentElement.setAttribute('data-image-quality', quality);
    }
    
    // Cleanup method
    cleanup() {
        this.observers.forEach(observer => {
            if (observer && observer.disconnect) {
                observer.disconnect();
            }
        });
        this.observers.clear();
        this.resourceCache.clear();
    }
    
    // Start performance tracking
    startPerformanceTracking() {
        // Mark start of performance tracking
        performance.mark('laburar-performance-start');
        
        // Track user interactions
        this.trackUserInteractions();
    }
    
    trackUserInteractions() {
        let interactionCount = 0;
        
        ['click', 'keydown', 'scroll'].forEach(eventType => {
            document.addEventListener(eventType, () => {
                interactionCount++;
                
                // Log heavy interaction periods
                if (interactionCount % 100 === 0) {
                    console.log(`User interactions: ${interactionCount}`);
                }
            }, { passive: true });
        });
        
        this.metrics.userInteractions = () => interactionCount;
    }
    
    reportLongTask(entry) {
        // Report long tasks for debugging
        if (window.analytics) {
            window.analytics.track('Long Task', {
                duration: entry.duration,
                startTime: entry.startTime
            });
        }
    }
}

// Initialize performance manager
document.addEventListener('DOMContentLoaded', () => {
    window.laburAR = window.laburAR || {};
    window.laburAR.performance = new PerformanceManager();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.laburAR?.performance) {
        window.laburAR.performance.cleanup();
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceManager;
}