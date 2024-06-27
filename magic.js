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
async function main() {
    async function getPythonScript(scriptPath) {
        const scriptResponse = await fetch(window.kizuna_ai_web_ai_extractor_example_root + scriptPath);
        if (!scriptResponse.ok) {
            throw new Error(`Failed to fetch the script: ${scriptResponse.statusText}`);
        }
        return await scriptResponse.text();
    }

    try {
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

        // load the main script
        return pyodide.runPython(await getPythonScript("/magic.py"));
    } catch (error) {
        console.error('Error in main function:', error);
        throw error;
    }
}

// Function to run the main script if all conditions are met
async function runScriptIfConditionsMet() {
    try {
        if (checkBrowserVersion() && await checkTopLevelAwaitSupport() && await checkGeminiSupport()) {
            const res = await main();
            if (res) console.log((JSON.parse(res)));
        } else {
            console.log('Your browser does not meet the requirements to run the script');
        }
    } catch (error) {
        console.error('Error running the script:', error);
    }
}


let kizunaAICurrentScriptUrl = document.currentScript.src;
window.kizuna_ai_web_ai_extractor_example_root = kizunaAICurrentScriptUrl.substring(0, kizunaAICurrentScriptUrl.lastIndexOf('/'));
// window.kizuna_ai_web_ai_extractor_example_selector = "#rightArea";
// window.kizuna_ai_web_ai_extractor_example_prompt = "You are a product information extractor, I wll give you some text and you need to extract information from it.";
// window.kizuna_ai_web_ai_extractor_example_output_format = JSON.stringify({
//     "product_code": "code or number of the product, type: str",
//     "price": "Number of the product price, type: int",
//     "description": "Description of the product, type: str"
// })

let kizunaAIDependencyScript = document.createElement('script');
kizunaAIDependencyScript.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js';
kizunaAIDependencyScript.onload = runScriptIfConditionsMet;
kizunaAIDependencyScript.onerror = () => console.error('Failed to load Pyodide script');
document.head.appendChild(kizunaAIDependencyScript);
