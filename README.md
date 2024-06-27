# Extracting Product Information from Webpages Using Chrome Built-in AI: A Local-First Frontend Implementation
## Pre-requisites

### Latest Chrome with Built-in AI Support
You need to use Chrome with built-in AI (Gemini Nano) support. Chrome version > v127. You can download it from the [Dev](https://www.google.com/chrome/dev/) or [Canary](https://www.google.com/chrome/canary/) channels. To check when this version will enter stable, refer to the [Chrome Platform Status](https://chromestatus.com/roadmap).

After installing the Chrome with built-in AI support, you **need** to perform the following settings:
1. Go to `chrome://flags/#prompt-api-for-gemini-nano` and enable it.
2. Go to `chrome://flags/#optimization-guide-on-device-model` and enable it.
3. Restart Chrome.
4. Go to `chrome://components/`, click `Optimization Guide On Device Model`, and wait for the model to download.
5. Restart Chrome again, and you can start testing in the Chrome dev console.

You can also refer to this [blog](https://azukiazusa.dev/blog/try-chrome-internal-ai-gemini-nano/) for configuration.

For more information on how to use the latest API, visit [AI on Chrome](https://developer.chrome.com/docs/ai/built-in).

### Knowledge of Python and JavaScript
This is part of my personal project which uses Python as a unified language for both frontend and backend. However, the part introduced in this article can run independently on the frontend (browser side) without requiring the backend. If you want to implement it purely in JavaScript, it is possible, but you may need to rewrite many modules from scratch.

## Creating a Product Information Extractor

### Check Browser Environment Requirements
Before starting our program, we need to check if the browser meets our requirements.

#### Check Browser Version
```js
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
```
#### Check if Top-Level Await is Supported
Since the JS part is just a simple startup script without packaging, and for convenience, we used top-level await, which is supported by most browsers now. We should still check for it.
```js
// Function to check if top-level await is supported
async function checkTopLevelAwaitSupport() {
    try {
        await Promise.resolve();
        return true;
    } catch (error) {
        return false;
    }
}
```
#### Check if Built-in AI is Supported
```js
async function checkGeminiSupport() {
    if (!window.ai) return false;
    if (!window.ai.canCreateTextSession) return false;
    const canCreate = await window.ai.canCreateTextSession();
    return canCreate === 'readily';
}
```

### Load the Program
When all conditions are met, we can load the program. Loading the program still requires JavaScript.
```js
// Function to load and run the main script
async function main() {
    async function getPythonScript(scriptPath) {
        const scriptResponse = await fetch(window.kizuna_product_pulse_origin+ scriptPath);
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
        return pyodide.runPython(await getPythonScript("/collector/scripts/magic.py"));
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
            if (res) console.log(res.toJs());
        } else {
            console.log('Your browser does not meet the requirements to run the script');
        }
    } catch (error) {
        console.error('Error running the script:', error);
    }
}


const kizunaCurrentScriptUrl = new URL(document.currentScript.src);
window.kizuna_product_pulse_origin = kizunaCurrentScriptUrl.origin;

const kizunaProductPulseDependencyScript = document.createElement('script');
kizunaProductPulseDependencyScript.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js';
kizunaProductPulseDependencyScript.onload = runScriptIfConditionsMet;
kizunaProductPulseDependencyScript.onerror = () => console.error('Failed to load Pyodide script');
document.head.appendChild(kizunaProductPulseDependencyScript);

```

### Extract Information from the Webpage
Since the context length supported by Gemini Nano is quite small, we need to trim the webpage content. Here are two methods to achieve this.

#### Using Boilerplate Removal
You can use any suitable boilerplate removal module for Python web scraping. For convenience, I manually set a selector to specify the reading range.
```js
window.kizuna_ai_web_ai_extractor_example_selector = "#rightArea";
```

#### Convert HTML to Text
The purpose of converting to text is:
* Remove unnecessary HTML tags
* Retain only visible content

Here we use [inscriptis](https://github.com/weblyzard/inscriptis) to convert HTML to plain text. You can also try converting the webpage content to Markdown, as Markdown is more friendly to most LLMs and often results in more accurate outputs.

```python
# Extract text from HTML
html = document.querySelector(kizuna_ai_web_ai_extractor_example_selector).outerHTML
text = get_text(html)
```

### Extract Information Using LLM
Since Chrome's built-in AI currently doesn't have an API like other services, we simply concatenate the system_prompt and user_prompt. If you want to adjust temperature and top_k, you can pass them in when creating the TextSession. Here, system_prompt is the prompt we use to extract content. user_prompt is the content extracted from the webpage.
```python
async def custom_llm(system_prompt: str, user_prompt: str):
    ''' you can change it to your own LLM '''
    session = await window.ai.createTextSession()
    result = await session.prompt(system_prompt + "\n" + user_prompt)
    return result
```

### Generate Structured Data
Using LLM, we cannot ensure 100% structured (e.g., JSON format) data, but we usually have several methods to improve the success rate and ultimately get JSON-formatted data. Here are a few methods we can try:
#### 1. Prompt Engineering:
One of the simplest methods is to use prompt engineering to instruct the LLM to output in JSON format. However, this method is not always reliable and can be inconsistent across different models. For example, you can include instructions like:
```text
Output your response in valid JSON format. Do not include any text outside of the JSON structure.
```

#### 2. Post-Processing
Implement post-processing logic to handle cases where the LLM output isn't perfect JSON. This could involve:
* Using regular expressions to extract JSON-like structures
* Implementing error handling and correction for common JSON formatting issues

#### 3. Validation Loop
Implement a validation loop that checks if the output is valid JSON and conforms to your expected schema. If validation fails, you can retry the query or apply fallback strategies.

I used [strictjson](https://github.com/jiangzhuo/strictjson) here.

Here is the complete python script:
```python
import json

import micropip
from js import document, kizuna_ai_web_ai_extractor_example_root, kizuna_ai_web_ai_extractor_example_selector, \
    kizuna_ai_web_ai_extractor_example_prompt, kizuna_ai_web_ai_extractor_example_output_format, window


async def main():
    try:
        await micropip.install("numpy")
        await micropip.install(f"{kizuna_ai_web_ai_extractor_example_root}/whl/inscriptis-2.5.0-py3-none-any.whl")
        await micropip.install(f"{kizuna_ai_web_ai_extractor_example_root}/whl/strictjson-4.1.0-py3-none-any.whl")
        from inscriptis import get_text
        from strictjson import strict_json_async

    except Exception as e:
        print(f"Failed to install the package: {e}")
        raise

    try:
        # Extract text from HTML
        html = document.querySelector(kizuna_ai_web_ai_extractor_example_selector).outerHTML
        text = get_text(html)
    except Exception as e:
        print(f"Failed to extract text from HTML: {e}")
        raise

    try:
        async def custom_llm(system_prompt: str, user_prompt: str):
            ''' you can change it to your own LLM '''
            session = await window.ai.createTextSession()
            result = await session.prompt(system_prompt + "\n" + user_prompt)
            print(result)
            return result

        res = await strict_json_async(
            system_prompt=kizuna_ai_web_ai_extractor_example_prompt,
            user_prompt=text,
            output_format=json.loads(kizuna_ai_web_ai_extractor_example_output_format),
            llm_async=custom_llm)  # set this to your own LLM

    except Exception as e:
        print(f"Error in running llm: {e}")
        raise
    print(res)
    return json.dumps(res, ensure_ascii=False)


main()
```

## Result
#### Insert this JS snippet into any webpage you want to extract information from
```js
(function() {
    // the area content useful information
    window.kizuna_ai_web_ai_extractor_example_selector = "#rightArea";
    // the system prompt 
    window.kizuna_ai_web_ai_extractor_example_prompt = "You are a product information extractor, I wll give you some text and you need to extract information from it.";
    // the output json format
    window.kizuna_ai_web_ai_extractor_example_output_format = JSON.stringify({
        "name": "name of the product, type: str",
        "code": "code or number of the product, type: str",
        "price": "Number of the product price, type: str",
        "description": "Description of the product, type: str"
    })
    var script = document.createElement('script');
    script.src = 'https://lab.kizuna.ai/web-ai-extractor-example/magic.js';
    script.type = 'text/javascript';
    script.async = true;
    document.head.appendChild(script);
})();
```
It can run on almost any website, and you will see the output in the dev console as shown below:

![ingni-store_com.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/566477/54cd22fb-f5ed-d718-d9fd-8bc15a33f6be.png)

![chiikawamarket_jp.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/566477/39d37d7e-f52a-0003-2bcf-38af9811b2e7.png)

![cardrush-mtg_jp.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/566477/a9fa66c1-ecd7-f9b0-7373-0cdeecb10f1b.png)


## Issues
* Gemini Nano, as a LLM with few parameters, has quite limited capabilities.
* Input and output lengths are limited. Errors often occur when tokens are too many.
* Cannot utilize GPU's computing power, resulting in poor inference efficiency.

Solutions to the above issues:

* Chrome built-in AI is still in the development stage. As Chrome continues to develop, model inference errors will improve.
* Prompt optimization can improve accuracy.
* Converting user_prompt to Markdown format can further reduce input.
* You can replace the LLM with others, such as using Transformers.js + ONNX Runtime WebGPU. This is exactly what I do in actual production.


## 源代码uuuuuuuuu
https://github.com/jiangzhuo/web-ai-extractor-example

https://github.com/jiangzhuo/strictjson

https://github.com/weblyzard/inscriptis
