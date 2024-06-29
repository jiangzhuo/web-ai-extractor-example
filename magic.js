// Function to check if the browser version meets the requirements
function checkBrowserVersion() {
    try {
        const ua = navigator.userAgent;
        const isFirefox = ua.includes('Firefox');
        const isChrome = ua.includes('Chrome');
        const isSafari = ua.includes('Safari') && !ua.includes('Chrome');

        if (isFirefox) {
            const version = parseInt(ua.split('Firefox/')[1], 10);
            // return version > 112;
            return false;
        } else if (isChrome) {
            const version = parseInt(ua.split('Chrome/')[1].split(' ')[0], 10);
            return version > 126;
        } else if (isSafari) {
            const version = parseInt(ua.split('Version/')[1].split(' ')[0], 10);
            // return version > 16.4;
            return false;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error checking browser version:', error);
        return false;
    }
}

// Function to check if top-level await is supported
async function checkTopLevelAwaitSupport() {
    try {
        await Promise.resolve();
        return true;
    } catch (error) {
        return false;
    }
}

async function checkGeminiSupport() {
    if (!window.ai) return false;
    if (!window.ai.canCreateTextSession) return false;
    const canCreate = await window.ai.canCreateTextSession();
    return canCreate === 'readily';
}

// Function to load and run the main script
async function main(selector, system_prompt, output_format) {
    try {
        window.pyodide.globals.set("selector", selector);
        window.pyodide.globals.set("system_prompt", system_prompt);
        window.pyodide.globals.set("output_format", output_format);

        // load the main script
        async function getPythonScript(scriptPath) {
            const scriptResponse = await fetch(window.pyodide.globals.get('resource_root') + scriptPath);
            if (!scriptResponse.ok) {
                throw new Error(`Failed to fetch the script: ${scriptResponse.statusText}`);
            }
            return await scriptResponse.text();
        }

        return window.pyodide.runPython(await getPythonScript("/magic.py"));
    } catch (error) {
        console.error('Error in main function:', error);
        throw error;
    }
}

// Function to run the main script if all conditions are met
async function runScriptIfConditionsMet(selector, system_prompt, output_format) {
    const resource_root = window.kizuna_ai_web_ai_extractor_example_root;
    if (!selector) selector = window.kizuna_ai_web_ai_extractor_example_selector;
    if (!system_prompt) system_prompt = window.kizuna_ai_web_ai_extractor_example_prompt;
    if (!output_format) output_format = window.kizuna_ai_web_ai_extractor_example_output_format;
    try {
        if (checkBrowserVersion() && await checkTopLevelAwaitSupport() && await checkGeminiSupport()) {
            if (!window.pyodide) {
                const pyodide = await loadPyodide();
                await pyodide.loadPackage("micropip");
                // wait until the document readyState is complete
                await new Promise((resolve) => {
                    if (document.readyState === 'complete') {
                        resolve();
                    } else {
                        document.addEventListener('readystatechange', () => {
                            if (document.readyState === 'complete') {
                                resolve();
                            }
                        });
                    }
                });
                pyodide.globals.set("resource_root", resource_root);
                window.pyodide = pyodide;
            }
            // const res = await main(selector, system_prompt, output_format);
            // Dispatch a custom event to signal that pyodide is ready
            console.log('kizunai_ai_web_ai_extractor is ready');
            const event = new CustomEvent('kizuna_ai_web_ai_extractor_ready');
            window.dispatchEvent(event);
        } else {
            console.log('Your browser does not meet the requirements to run the script');
        }
    } catch (error) {
        console.error('Error running the script:', error);
    }
}

window.kizuna_ai_web_ai_extractor = main;

// if (!window.kizuna_ai_web_ai_extractor_example_selector) window.kizuna_ai_web_ai_extractor_example_selector = "#rightArea";
// if (!window.kizuna_ai_web_ai_extractor_example_prompt) window.kizuna_ai_web_ai_extractor_example_prompt = "You are a product information extractor, I wll give you some text and you need to extract information from it.";
// if (!window.kizuna_ai_web_ai_extractor_example_output_format) window.kizuna_ai_web_ai_extractor_example_output_format = JSON.stringify({
//     "product_code": "code or number of the product, type: str",
//     "price": "Number of the product price, type: int",
//     "description": "Description of the product, type: str"
// });

window.kizuna_ai_current_script_url = document.currentScript.src;
window.kizuna_ai_web_ai_extractor_example_root = kizuna_ai_current_script_url.substring(0, kizuna_ai_current_script_url.lastIndexOf('/'));
if (!document.getElementById('kizuna-ai-web-ai-extractor-example-script')) {
    const script = document.createElement('script');
    script.id = 'kizuna-ai-web-ai-extractor-example-script';
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js';
    script.onload = () => runScriptIfConditionsMet();
    script.onerror = () => console.error('Failed to load Pyodide script');
    document.head.appendChild(script);
}


