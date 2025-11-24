'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun, TextCursor, Eye, Code, Palette, Plus, Minus, Download, Copy, Check, ChevronDown, ChevronUp, Github, Star } from 'lucide-react';

interface TextLine {
    text: string;
    font: string;
    color: string;
    fontSize: number;
    letterSpacing: string;
    typingSpeed: number;
    deleteSpeed: number;
    fontWeight: string;
    lineHeight: number;
}

interface GitHubStats {
    stars: number;
    loading: boolean;
}

// New deletion behavior type
type DeletionBehavior = 'stay' | 'backspace' | 'clear';

/**
 * Default values - should match the ones in utils.ts
 */
const DEFAULT_VALUES = {
    // Text line defaults
    font: 'Courier Prime',
    color: '#000000',
    fontSize: 28,
    letterSpacing: '0.1em',
    typingSpeed: 2, // chars/s (1/0.5 = 2)
    deleteSpeed: 2, // chars/s (1/0.5 = 2)
    fontWeight: '400',
    lineHeight: 1.3,
    
    // Global defaults
    width: 450,
    height: 150,
    pause: 1000,
    repeat: true,
    backgroundColor: '#ffffff',
    backgroundOpacity: 1,
    center: true,
    vCenter: true,
    border: true,
    cursorStyle: 'straight',
    deletionBehavior: 'backspace' as DeletionBehavior
};

export default function SVGGenerator() {
    const [textLines, setTextLines] = useState<TextLine[]>([
        { text: 'Hello, World!', font: 'Courier Prime', color: '#000000', fontSize: 28, letterSpacing: '0.1em', typingSpeed: 2, deleteSpeed: 2, fontWeight: '400', lineHeight: 1.3 },
        { text: 'And Emojis! 😀🚀', font: 'Courier Prime', color: '#000000', fontSize: 28, letterSpacing: '0.1em', typingSpeed: 2, deleteSpeed: 2, fontWeight: '400', lineHeight: 1.3 }
    ]);
    
    // Global settings
    const [width, setWidth] = useState(450);
    const [height, setHeight] = useState(150);
    const [pause, setPause] = useState(1000);
    const [repeat, setRepeat] = useState(true);
    const [backgroundColor, setBackgroundColor] = useState('#ffffff');
    const [backgroundOpacity, setBackgroundOpacity] = useState(1);
    const [center, setCenter] = useState(true);
    const [vCenter, setVCenter] = useState(true);
    const [border, setBorder] = useState(true);
    const [cursorStyle, setCursorStyle] = useState('straight');
    // Updated deletion behavior - replaces deleteAfter boolean
    const [deletionBehavior, setDeletionBehavior] = useState<DeletionBehavior>('backspace');
    
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [origin, setOrigin] = useState('');
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
    const [isLoading, setIsLoading] = useState(false);
    const [expandedLines, setExpandedLines] = useState<Set<number>>(new Set([0])); // First line expanded by default
    const [cursorDropdownOpen, setCursorDropdownOpen] = useState(false);
    const [githubStats, setGithubStats] = useState<GitHubStats>({ stars: 0, loading: true });
    
    const cursorOptions = [
        { value: 'straight', label: 'Straight', icon: '|' },
        { value: 'underline', label: 'Underline', icon: '_' },
        { value: 'block', label: 'Block', icon: '█' },
        { value: 'blank', label: 'Blank (No Cursor)', icon: '○' }
    ];

    const GITHUB_REPO = 'whiteSHADOW1234/TypingSVG';

    // Fetch GitHub stars
    useEffect(() => {
        const fetchGitHubStats = async () => {
            try {
                const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`);
                if (response.ok) {
                    const data = await response.json();
                    setGithubStats({ stars: data.stargazers_count, loading: false });
                } else {
                    setGithubStats({ stars: 0, loading: false });
                }
            } catch (error) {
                console.error('Failed to fetch GitHub stats:', error);
                setGithubStats({ stars: 0, loading: false });
            }
        };

        fetchGitHubStats();
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setOrigin(window.location.origin);
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('[data-cursor-dropdown]')) {
                setCursorDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Add loading state management for SVG updates
    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [textLines, width, height, pause, repeat, backgroundColor, backgroundOpacity, center, vCenter, border, cursorStyle, deletionBehavior]);

    // Helper function to convert char/s to s/char for API compatibility
    const convertCharsPerSecToSecsPerChar = (charsPerSec: number): number => {
        return charsPerSec > 0 ? 1 / charsPerSec : 0.5;
    };

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => {
            setNotification({ show: false, message: '', type: 'success' });
        }, 3000);
    };

    const updateTextLine = (index: number, field: keyof TextLine, value: string | number) => {
        const newTextLines = [...textLines];
        newTextLines[index] = { ...newTextLines[index], [field]: value };
        setTextLines(newTextLines);
    };

    const addTextLine = () => {
        const newLine: TextLine = {
            text: '',
            font: 'Courier Prime',
            color: '#000000',
            fontSize: 28,
            letterSpacing: '0.1em',
            typingSpeed: 2,
            deleteSpeed: 2,
            fontWeight: '400',
            lineHeight: 1.3
        };
        setTextLines([...textLines, newLine]);
        // Expand the newly added line
        setExpandedLines(prev => new Set([...prev, textLines.length]));
    };

    const removeTextLine = (index: number) => {
        if (textLines.length > 1) {
            const newTextLines = textLines.filter((_, i) => i !== index);
            setTextLines(newTextLines);
            // Remove from expanded lines and adjust indices
            setExpandedLines(prev => {
                const newExpanded = new Set<number>();
                prev.forEach(lineIndex => {
                    if (lineIndex < index) {
                        newExpanded.add(lineIndex);
                    } else if (lineIndex > index) {
                        newExpanded.add(lineIndex - 1);
                    }
                });
                return newExpanded;
            });
        }
    };

    const toggleLineExpansion = (index: number) => {
        setExpandedLines(prev => {
            const newExpanded = new Set(prev);
            if (newExpanded.has(index)) {
                newExpanded.delete(index);
            } else {
                newExpanded.add(index);
            }
            return newExpanded;
        });
    };

    /**
     * Helper function to check if a text line uses default values
     */
    const isLineUsingDefaults = (line: TextLine): boolean => {
        return (
            line.font === DEFAULT_VALUES.font &&
            line.color === DEFAULT_VALUES.color &&
            line.fontSize === DEFAULT_VALUES.fontSize &&
            line.letterSpacing === DEFAULT_VALUES.letterSpacing &&
            line.typingSpeed === DEFAULT_VALUES.typingSpeed &&
            line.deleteSpeed === DEFAULT_VALUES.deleteSpeed &&
            line.fontWeight === DEFAULT_VALUES.fontWeight &&
            line.lineHeight === DEFAULT_VALUES.lineHeight
        );
    };

    /**
     * Create a minimal text line object with only non-default values
     * Convert char/s to s/char for API compatibility
     */
    const createMinimalLine = (line: TextLine): Partial<TextLine> => {
        const minimal: Partial<TextLine> = { text: line.text };
        
        if (line.font !== DEFAULT_VALUES.font) minimal.font = line.font;
        if (line.color !== DEFAULT_VALUES.color) minimal.color = line.color;
        if (line.fontSize !== DEFAULT_VALUES.fontSize) minimal.fontSize = line.fontSize;
        if (line.letterSpacing !== DEFAULT_VALUES.letterSpacing) minimal.letterSpacing = line.letterSpacing;
        if (line.typingSpeed !== DEFAULT_VALUES.typingSpeed) minimal.typingSpeed = convertCharsPerSecToSecsPerChar(line.typingSpeed);
        if (line.deleteSpeed !== DEFAULT_VALUES.deleteSpeed) minimal.deleteSpeed = convertCharsPerSecToSecsPerChar(line.deleteSpeed);
        if (line.fontWeight !== DEFAULT_VALUES.fontWeight) minimal.fontWeight = line.fontWeight;
        if (line.lineHeight !== DEFAULT_VALUES.lineHeight) minimal.lineHeight = line.lineHeight;
        
        return minimal;
    };

    const generateQueryString = () => {
        const params = new URLSearchParams();
        
        // Only add global parameters if they differ from defaults
        if (width !== DEFAULT_VALUES.width) params.append('width', String(width));
        if (height !== DEFAULT_VALUES.height) params.append('height', String(height));
        if (pause !== DEFAULT_VALUES.pause) params.append('pause', String(pause));
        if (repeat !== DEFAULT_VALUES.repeat) params.append('repeat', String(repeat));
        if (backgroundColor !== DEFAULT_VALUES.backgroundColor) params.append('backgroundColor', backgroundColor);
        if (backgroundOpacity !== DEFAULT_VALUES.backgroundOpacity) params.append('backgroundOpacity', String(backgroundOpacity));
        if (center !== DEFAULT_VALUES.center) params.append('center', String(center));
        if (vCenter !== DEFAULT_VALUES.vCenter) params.append('vCenter', String(vCenter));
        if (border !== DEFAULT_VALUES.border) params.append('border', String(border));
        if (cursorStyle !== DEFAULT_VALUES.cursorStyle) params.append('cursorStyle', cursorStyle);
        if (deletionBehavior !== DEFAULT_VALUES.deletionBehavior) params.append('deletionBehavior', deletionBehavior);

        // Filter out lines with empty text and create minimal line objects
        const validLines = textLines.filter(line => line.text.trim() !== '');
        const minimalLines = validLines.map(createMinimalLine);
        
        // Only add lines parameter if we have valid lines
        if (minimalLines.length > 0) {
            params.append('lines', JSON.stringify(minimalLines));
        }

        return params.toString();
    };

    const svgUrl = `/api/svg?${generateQueryString()}`;
    const fullSvgUrl = `${origin}${svgUrl}`;

    const handleDownload = async () => {
        try {
            const response = await fetch(svgUrl);
            const svgBlob = await response.blob();
            const url = window.URL.createObjectURL(svgBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'typing-svg.svg';
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            showNotification('SVG downloaded to Downloads folder!');
        } catch (error) {
            console.error('Failed to download SVG:', error);
            showNotification('Failed to download SVG', 'error');
        }
    };

    const openGitHub = () => {
        window.open(`https://github.com/${GITHUB_REPO}`, '_blank');
    };

    return (
        <div className={`min-h-screen transition-all duration-300 ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
            {/* Notification Toast */}
            <div className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ${
                notification.show ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
            }`}>
                <div className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
                    notification.type === 'success' 
                        ? (isDarkMode ? 'bg-green-900 border border-green-700 text-green-200' : 'bg-green-100 border border-green-300 text-green-800')
                        : (isDarkMode ? 'bg-red-900 border border-red-700 text-red-200' : 'bg-red-100 border border-red-300 text-red-800')
                }`}>
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">{notification.message}</span>
                </div>
            </div>

            <div className="container mx-auto p-4 sm:p-6">
                {/* Header with Dark Mode Toggle and GitHub Buttons */}
                <div className="mb-8">
                    {/* Mobile-first responsive header */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        {/* Logo and Title */}
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-yellow-500' : 'bg-blue-500'}`}>
                                <TextCursor className="w-6 h-6 text-white" />
                            </div>
                            <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r ${isDarkMode ? 'from-yellow-400 to-yellow-200' : 'from-blue-600 to-purple-600'} bg-clip-text text-transparent`}>
                                Typing SVG Generator
                            </h1>
                        </div>
                        
                        {/* Buttons - responsive layout */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* GitHub Repo Button */}
                            <button
                                onClick={openGitHub}
                                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-full text-sm sm:text-base transition-all duration-300 ${
                                    isDarkMode 
                                        ? 'bg-gray-800 border border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500' 
                                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                                } shadow-lg`}
                            >
                                <Github className="w-4 h-4" />
                                <span className="text-xs sm:text-sm">GitHub</span>
                            </button>

                            {/* Star Button */}
                            <button
                                onClick={openGitHub}
                                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-full text-sm sm:text-base transition-all duration-300 ${
                                    isDarkMode 
                                        ? 'bg-gray-800 border border-yellow-500/30 text-yellow-400 hover:bg-gray-700 hover:border-yellow-500/50' 
                                        : 'bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300'
                                } shadow-lg`}
                            >
                                <Star className={`w-4 h-4 ${githubStats.loading ? 'animate-pulse' : ''}`} />
                                <span className="text-xs sm:text-sm">
                                    {githubStats.loading ? '...' : githubStats.stars.toLocaleString()}
                                </span>
                            </button>

                            {/* Dark/Light Mode Toggle */}
                            <button
                                onClick={() => setIsDarkMode(!isDarkMode)}
                                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-full text-sm sm:text-base transition-all duration-300 ${
                                    isDarkMode 
                                        ? 'bg-gray-800 border border-yellow-500 text-yellow-400 hover:bg-gray-700' 
                                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                } shadow-lg`}
                            >
                                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                                <span className="text-xs sm:text-sm">{isDarkMode ? 'Light' : 'Dark'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                    {/* --- CONTROLS COLUMN --- */}
                    <div className={`p-4 sm:p-6 rounded-2xl border transition-all duration-300 ${
                        isDarkMode 
                            ? 'bg-gray-900 border-gray-700' 
                            : 'bg-white border-gray-200'
                    } shadow-xl`}>
                        <div className="flex items-center gap-2 mb-4 sm:mb-6">
                            <Palette className={`w-5 h-5 ${isDarkMode ? 'text-yellow-400' : 'text-blue-500'}`} />
                            <h2 className={`text-lg sm:text-xl font-semibold ${isDarkMode ? 'text-yellow-300' : 'text-gray-900'}`}>
                                Configuration
                            </h2>
                        </div>
                        
                        <div className="space-y-4 sm:space-y-5">
                            {/* Text Lines with Individual Controls */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Text Lines
                                    </label>
                                    <button 
                                        onClick={addTextLine} 
                                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all duration-200 ${
                                            isDarkMode 
                                                ? 'text-yellow-400 hover:bg-gray-800 border border-yellow-500/20 hover:border-yellow-500/40' 
                                                : 'text-blue-600 hover:bg-blue-50 border border-blue-200 hover:border-blue-300'
                                        }`}
                                    >
                                        <Plus className="w-3 h-3" />
                                        Add Line
                                    </button>
                                </div>
                                
                                {textLines.map((line, index) => (
                                    <div key={index} className={`group border rounded-lg transition-all duration-200 ${
                                        isDarkMode 
                                            ? 'border-gray-700 bg-gray-800/30' 
                                            : 'border-gray-200 bg-gray-50/50'
                                    }`}>
                                        {/* Line Header */}
                                        <div className={`flex items-center gap-3 p-3 cursor-pointer ${
                                            isDarkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-100/50'
                                        }`} onClick={() => toggleLineExpansion(index)}>
                                            <div className={`flex-shrink-0 px-2 py-1 rounded text-xs font-mono font-medium ${
                                                isDarkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-200 text-gray-600'
                                            }`}>
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`truncate text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    {line.text || `Line ${index + 1}`}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {textLines.length > 1 && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeTextLine(index);
                                                        }}
                                                        className={`p-1 rounded transition-all duration-200 ${
                                                            isDarkMode 
                                                                ? 'text-red-400 hover:bg-red-900/20' 
                                                                : 'text-red-500 hover:bg-red-100'
                                                        }`}
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                )}
                                                {expandedLines.has(index) ? (
                                                    <ChevronUp className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                                ) : (
                                                    <ChevronDown className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Expandable Line Settings */}
                                        {expandedLines.has(index) && (
                                            <div className={`border-t p-4 space-y-4 ${
                                                isDarkMode ? 'border-gray-700' : 'border-gray-200'
                                            }`}>
                                                {/* Text Input */}
                                                <div>
                                                    <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        Text Content
                                                    </label>
                                                    <textarea
                                                        value={line.text}
                                                        onChange={(e) => updateTextLine(index, 'text', e.target.value)}
                                                        className={`flex w-full items-center px-3 py-2 text-sm rounded-lg border transition-all duration-200 resize-none ${
                                                            isDarkMode 
                                                                ? 'bg-gray-800 border-gray-600 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/20' 
                                                                : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'
                                                        }`}
                                                        placeholder={`Line ${index + 1}`}
                                                        rows={1}
                                                        onInput={(e) => {
                                                            const target = e.target as HTMLTextAreaElement;
                                                            target.style.height = 'auto';
                                                            target.style.height = target.scrollHeight + 'px';
                                                        }}
                                                    />
                                                </div>
                                                
                                                {/* Font and Size */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <InputField 
                                                        label="Font Family" 
                                                        type="text" 
                                                        value={line.font} 
                                                        onChange={(e) => updateTextLine(index, 'font', e.target.value)}
                                                        isDarkMode={isDarkMode}
                                                        size="small"
                                                    />
                                                    <InputField 
                                                        label="Font Size" 
                                                        type="number" 
                                                        value={line.fontSize} 
                                                        onChange={(e) => updateTextLine(index, 'fontSize', parseInt(e.target.value, 10) || 0)}
                                                        isDarkMode={isDarkMode}
                                                        size="small"
                                                    />
                                                </div>
                                                
                                                {/* Color and Letter Spacing */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <ColorField 
                                                        label="Text Color" 
                                                        value={line.color} 
                                                        onChange={(e) => updateTextLine(index, 'color', e.target.value)}
                                                        isDarkMode={isDarkMode}
                                                        size="small"
                                                    />
                                                    <InputField 
                                                        label="Letter Spacing" 
                                                        type="text" 
                                                        value={line.letterSpacing} 
                                                        onChange={(e) => updateTextLine(index, 'letterSpacing', e.target.value)}
                                                        isDarkMode={isDarkMode}
                                                        size="small"
                                                        placeholder="0.1em, 2px, normal"
                                                    />
                                                </div>
                                                
                                                {/* Typing Speed and Delete Speed */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <InputField 
                                                        label="Typing Speed (char/s)" 
                                                        type="number" 
                                                        step="0.01"
                                                        value={line.typingSpeed} 
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                            const inputValue = parseFloat(e.target.value) || 0;
                                                            updateTextLine(index, 'typingSpeed', inputValue);
                                                        }}
                                                        isDarkMode={isDarkMode}
                                                        size="small"
                                                    />
                                                    <InputField 
                                                        label="Delete Speed (char/s)" 
                                                        type="number" 
                                                        step="0.01"
                                                        value={line.deleteSpeed} 
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                            const inputValue = parseFloat(e.target.value) || 0;
                                                            updateTextLine(index, 'deleteSpeed', inputValue);
                                                        }}
                                                        isDarkMode={isDarkMode}
                                                        size="small"
                                                    />
                                                </div>

                                                {/* Font Weight and Line Height */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <InputField 
                                                        label="Font Weight" 
                                                        type="text" 
                                                        value={line.fontWeight} 
                                                        onChange={(e) => updateTextLine(index, 'fontWeight', e.target.value)}
                                                        isDarkMode={isDarkMode}
                                                        size="small"
                                                        placeholder="400, 500, bold"
                                                    />
                                                    <InputField 
                                                        label="Line Height" 
                                                        type="number" 
                                                        step="0.1"
                                                        value={line.lineHeight} 
                                                        onChange={(e) => updateTextLine(index, 'lineHeight', parseFloat(e.target.value) || 1.3)}
                                                        isDarkMode={isDarkMode}
                                                        size="small"
                                                        placeholder="1.3"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Global Settings */}
                            <div className={`border-t pt-5 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                <h3 className={`text-sm font-medium mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Global Settings
                                </h3>
                                
                                {/* Dimensions */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4"> 
                                    <InputField 
                                        label="Width" 
                                        type="number" 
                                        value={width} 
                                        onChange={(e) => setWidth(parseInt(e.target.value, 10) || 0)}
                                        isDarkMode={isDarkMode}
                                    /> 
                                    <InputField 
                                        label="Height" 
                                        type="number" 
                                        value={height} 
                                        onChange={(e) => setHeight(parseInt(e.target.value, 10) || 0)}
                                        isDarkMode={isDarkMode}
                                    /> 
                                </div>

                                {/* Background and Pause */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                    <ColorField 
                                        label="Background Color" 
                                        value={backgroundColor} 
                                        onChange={(e) => setBackgroundColor(e.target.value)}
                                        isDarkMode={isDarkMode}
                                    />
                                    <InputField 
                                        label="End Pause (ms)" 
                                        type="number" 
                                        value={pause} 
                                        onChange={(e) => setPause(parseInt(e.target.value, 10) || 0)}
                                        isDarkMode={isDarkMode}
                                    />
                                </div>

                                {/* Background Opacity */}
                                <div className="mb-4">
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Background Opacity
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <div className="relative flex-1">
                                            <input 
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.01"
                                                value={backgroundOpacity}
                                                onChange={(e) => setBackgroundOpacity(parseFloat(e.target.value))}
                                                className={`w-full h-2 rounded-lg appearance-none cursor-pointer transition-all duration-200 focus:outline-none ${
                                                    isDarkMode ? 'range-slider-dark' : 'range-slider-light'
                                                }`}
                                                style={{
                                                    background: `linear-gradient(to right, ${
                                                        isDarkMode 
                                                            ? `#eab308 0%, #eab308 ${backgroundOpacity * 100}%, #374151 ${backgroundOpacity * 100}%, #374151 100%`
                                                            : `#3b82f6 0%, #3b82f6 ${backgroundOpacity * 100}%, #e5e7eb ${backgroundOpacity * 100}%, #e5e7eb 100%`
                                                    })`
                                                }}
                                            />
                                        </div>
                                        <div className={`flex flex-col items-end min-w-[3.5rem] ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            <span className="text-sm font-mono font-medium">
                                                {Math.round(backgroundOpacity * 100)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Cursor Style - Custom Dropdown */}
                                <div className="mb-4" data-cursor-dropdown>
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Cursor Style
                                    </label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setCursorDropdownOpen(!cursorDropdownOpen)}
                                            className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 flex items-center justify-between ${
                                                isDarkMode 
                                                    ? 'bg-gray-800 border-gray-600 text-white focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20' 
                                                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                                            } ${cursorDropdownOpen ? (isDarkMode ? 'border-yellow-500 ring-2 ring-yellow-500/20' : 'border-blue-500 ring-2 ring-blue-500/20') : ''}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`font-mono text-lg ${isDarkMode ? 'text-yellow-400' : 'text-blue-600'}`}>
                                                    {cursorOptions.find(opt => opt.value === cursorStyle)?.icon}
                                                </span>
                                                <span>{cursorOptions.find(opt => opt.value === cursorStyle)?.label}</span>
                                            </div>
                                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                                                cursorDropdownOpen ? 'rotate-180' : ''
                                            } ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                        </button>
                                        
                                        {cursorDropdownOpen && (
                                            <div className={`absolute top-full left-0 right-0 mt-1 rounded-lg border shadow-lg z-50 ${
                                                isDarkMode 
                                                    ? 'bg-gray-800 border-gray-600' 
                                                    : 'bg-white border-gray-200'
                                            }`}>
                                                {cursorOptions.map((option) => (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        onClick={() => {
                                                            setCursorStyle(option.value);
                                                            setCursorDropdownOpen(false);
                                                        }}
                                                        className={`w-full px-3 py-3 flex items-center gap-3 text-left transition-all duration-150 first:rounded-t-lg last:rounded-b-lg ${
                                                            cursorStyle === option.value
                                                                ? (isDarkMode 
                                                                    ? 'bg-yellow-500/10 text-yellow-400' 
                                                                    : 'bg-blue-500/10 text-blue-600')
                                                                : (isDarkMode 
                                                                    ? 'text-gray-300 hover:bg-gray-700' 
                                                                    : 'text-gray-700 hover:bg-gray-50')
                                                        }`}
                                                    >
                                                        <span className={`font-mono text-lg ${
                                                            cursorStyle === option.value
                                                                ? (isDarkMode ? 'text-yellow-400' : 'text-blue-600')
                                                                : (isDarkMode ? 'text-gray-400' : 'text-gray-500')
                                                        }`}>
                                                            {option.icon}
                                                        </span>
                                                        <span className="flex-1">{option.label}</span>
                                                        {cursorStyle === option.value && (
                                                            <Check className={`w-4 h-4 ${isDarkMode ? 'text-yellow-400' : 'text-blue-600'}`} />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Layout Options */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                    <Checkbox label="Center Horizontally" checked={center} onChange={setCenter} isDarkMode={isDarkMode} />
                                    <Checkbox label="Center Vertically" checked={vCenter} onChange={setVCenter} isDarkMode={isDarkMode} />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                    <Checkbox label="Repeat Animation" checked={repeat} onChange={setRepeat} isDarkMode={isDarkMode} />
                                    <Checkbox label="Show SVG Border" checked={border} onChange={setBorder} isDarkMode={isDarkMode} />
                                </div>

                                {/* Delete Behavior */}
                                <div className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-50/50'}`}>
                                    <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Text Lifecycle
                                    </label>
                                    <div className="space-y-3">
                                        <RadioOption
                                            id="stay"
                                            name="deletionBehavior"
                                            value="stay"
                                            checked={deletionBehavior === 'stay'}
                                            onChange={() => setDeletionBehavior('stay')}
                                            label="Stay after typing"
                                            description="Text remains visible and next line appears below"
                                            isDarkMode={isDarkMode}
                                        />
                                        <RadioOption
                                            id="backspace"
                                            name="deletionBehavior"
                                            value="backspace"
                                            checked={deletionBehavior === 'backspace'}
                                            onChange={() => setDeletionBehavior('backspace')}
                                            label="Delete character by character"
                                            description="Text is deleted one character at a time after pause"
                                            isDarkMode={isDarkMode}
                                        />
                                        <RadioOption
                                            id="clear"
                                            name="deletionBehavior"
                                            value="clear"
                                            checked={deletionBehavior === 'clear'}
                                            onChange={() => setDeletionBehavior('clear')}
                                            label="Clear instantly"
                                            description="All text disappears at once after pause"
                                            isDarkMode={isDarkMode}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- PREVIEW COLUMN --- */}
                    <div className="space-y-4 sm:space-y-6">
                        {/* Preview Section */}
                        <div className={`p-4 sm:p-6 rounded-2xl border transition-all duration-300 ${
                            isDarkMode 
                                ? 'bg-gray-900 border-gray-700' 
                                : 'bg-white border-gray-200'
                        } shadow-xl`}>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
                                <div className="flex items-center gap-2">
                                    <Eye className={`w-5 h-5 ${isDarkMode ? 'text-yellow-400' : 'text-blue-500'}`} />
                                    <h2 className={`text-lg sm:text-xl font-semibold ${isDarkMode ? 'text-yellow-300' : 'text-gray-900'}`}>
                                        Live Preview
                                    </h2>
                                </div>
                                <button
                                    onClick={handleDownload}
                                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base transition-all duration-300 ${
                                        isDarkMode
                                            ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 hover:border-yellow-500/50'
                                            : 'bg-blue-500/10 border border-blue-500/30 text-blue-600 hover:bg-blue-500/20 hover:border-blue-500/50'
                                    }`}
                                >
                                    <Download className="w-4 h-4" />
                                    Download
                                </button>
                            </div>
                            <div className={`border-2 border-dashed rounded-xl p-4 sm:p-8 flex items-center justify-center min-h-[150px] sm:min-h-[200px] relative ${
                                isDarkMode ? 'border-gray-700 bg-gray-800/30' : 'border-gray-300 bg-gray-50/50'
                            }`}>
                                {/* Loading Animation */}
                                {isLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-inherit rounded-xl backdrop-blur-sm">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className={`relative w-8 h-8 ${isDarkMode ? 'text-yellow-400' : 'text-blue-500'}`}>
                                                <div className="absolute inset-0 border-2 border-current rounded-full opacity-20"></div>
                                                <div className="absolute inset-0 border-2 border-transparent border-t-current rounded-full animate-spin"></div>
                                            </div>
                                            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                Updating preview...
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {/* SVG Image */}
                                <img 
                                    key={svgUrl} 
                                    src={svgUrl} 
                                    alt="Generated SVG" 
                                    className={`max-w-full h-auto transition-opacity duration-200 ${
                                        isLoading ? 'opacity-30' : 'opacity-100'
                                    }`}
                                    onLoad={() => setIsLoading(false)}
                                    onError={() => setIsLoading(false)}
                                />
                            </div>
                        </div>

                        {/* URL Section */}
                        <div className={`p-4 sm:p-6 rounded-2xl border transition-all duration-300 ${
                            isDarkMode 
                                ? 'bg-gray-900 border-gray-700' 
                                : 'bg-white border-gray-200'
                        } shadow-xl`}>
                            <div className="flex items-center gap-2 mb-4">
                                <Code className={`w-5 h-5 ${isDarkMode ? 'text-yellow-400' : 'text-blue-500'}`} />
                                <h2 className={`text-lg sm:text-xl font-semibold ${isDarkMode ? 'text-yellow-300' : 'text-gray-900'}`}>
                                    Generated Code
                                </h2>
                            </div>
                            <div className="space-y-4">
                                <UrlBox label="URL" value={fullSvgUrl} isDarkMode={isDarkMode} showNotification={showNotification} />
                                <UrlBox label="Markdown" value={`[![Typing SVG](${fullSvgUrl})](https://github.com/whiteSHADOW1234/TypingSVG)`} isDarkMode={isDarkMode} showNotification={showNotification} />
                                <UrlBox label="HTML" value={`<a href="https://github.com/whiteSHADOW1234/TypingSVG"><img src="${fullSvgUrl}" alt="Typing SVG" /></a>`} isDarkMode={isDarkMode} showNotification={showNotification} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const InputField = ({ 
    label, 
    type = "text", 
    value, 
    onChange, 
    isDarkMode, 
    className = "", 
    step,
    size = "normal",
    placeholder,
    ...props 
}: {
    label: string;
    type?: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isDarkMode: boolean;
    className?: string;
    step?: string;
    size?: "normal" | "small";
    placeholder?: string;
    [key: string]: unknown;
}) => (
    <div>
        <label className={`block font-medium mb-1 ${size === "small" ? "text-xs" : "text-sm"} ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {label}
        </label>
        <input 
            type={type}
            step={step}
            value={value} 
            onChange={onChange} 
            placeholder={placeholder}
            className={`w-full px-3 rounded-lg border transition-all duration-200 ${
                size === "small" ? "py-1.5 text-sm" : "py-2"
            } ${
                isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/20 placeholder-gray-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 placeholder-gray-400'
            } ${className}`}
            {...props}
        />
    </div>
);

const ColorField = ({ 
    label, 
    value, 
    onChange, 
    isDarkMode,
    size = "normal"
}: {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isDarkMode: boolean;
    size?: "normal" | "small";
}) => (
    <div>
        <label className={`block font-medium mb-1 ${size === "small" ? "text-xs" : "text-sm"} ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {label}
        </label>
        <div className="relative">
            <input 
                type="color" 
                value={value} 
                onChange={onChange} 
                className={`w-full rounded-lg border cursor-pointer transition-all duration-200 ${
                    size === "small" ? "h-8" : "h-10"
                } ${
                    isDarkMode 
                        ? 'border-gray-600 bg-gray-800' 
                        : 'border-gray-300 bg-white'
                }`}
            />
            <div className={`absolute right-2 top-1/2 transform -translate-y-1/2 font-mono ${
                size === "small" ? "text-xs" : "text-xs"
            } ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
                {value}
            </div>
        </div>
    </div>
);

const Checkbox = ({ 
    label, 
    checked, 
    onChange, 
    isDarkMode 
}: { 
    label: string; 
    checked: boolean; 
    onChange: (checked: boolean) => void;
    isDarkMode: boolean;
}) => (
    <div className="flex items-center">
        <input 
            id={label} 
            type="checkbox" 
            checked={checked} 
            onChange={(e) => onChange(e.target.checked)} 
            className={`h-4 w-4 rounded transition-colors ${
                isDarkMode 
                    ? 'border-gray-600 text-yellow-500 focus:ring-yellow-500 bg-gray-700' 
                    : 'border-gray-300 text-blue-600 focus:ring-blue-500'
            }`} 
        />
        <label htmlFor={label} className={`ml-2 block text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
            {label}
        </label>
    </div>
);

const UrlBox = ({ 
    label, 
    value, 
    isDarkMode,
    showNotification 
}: { 
    label: string; 
    value: string; 
    isDarkMode: boolean;
    showNotification: (message: string, type?: 'success' | 'error') => void;
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            showNotification(`${label} copied to clipboard!`);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
            showNotification('Failed to copy to clipboard', 'error');
        }
    };

    return (
        <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {label}
            </label>
            <div className="relative group">
                <div 
                    className={`p-3 pr-12 rounded-lg border font-mono text-sm break-all cursor-pointer transition-all duration-200 ${
                        isDarkMode 
                            ? 'bg-gray-800 border-gray-700 text-yellow-200 hover:bg-gray-700/70 hover:border-gray-600' 
                            : 'bg-gray-100 border-gray-200 text-gray-800 hover:bg-gray-150 hover:border-gray-300'
                    }`}
                    onClick={handleCopy}
                >
                    {value}
                </div>
                <button 
                    onClick={handleCopy}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-md transition-all duration-200 ${
                        isDarkMode 
                            ? 'text-gray-400 hover:bg-gray-600 hover:text-yellow-400' 
                            : 'text-gray-500 hover:bg-gray-200 hover:text-blue-600'
                    }`}
                    aria-label="Copy to clipboard"
                >
                    {copied ? (
                        <Check className={`w-4 h-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                    ) : (
                        <Copy className="w-4 h-4" />
                    )}
                </button>
            </div>
        </div>
    );
};

// Helper component for radio button options
const RadioOption = ({ 
    id, 
    name, 
    value, 
    checked, 
    onChange, 
    label, 
    description, 
    isDarkMode 
}: {
    id: string;
    name: string;
    value: string;
    checked: boolean;
    onChange: () => void;
    label: string;
    description: string;
    isDarkMode: boolean;
}) => (
    <div className="flex items-start gap-3">
        <input 
            id={id}
            name={name}
            type="radio" 
            value={value}
            checked={checked}
            onChange={onChange}
            className={`mt-1 h-4 w-4 transition-colors ${
                isDarkMode 
                    ? 'border-gray-600 text-yellow-500 focus:ring-yellow-500 bg-gray-700' 
                    : 'border-gray-300 text-blue-600 focus:ring-blue-500'
            }`} 
        />
        <div className="flex-1">
            <label htmlFor={id} className={`block text-sm font-medium cursor-pointer ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {label}
            </label>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {description}
            </p>
        </div>
    </div>
);
