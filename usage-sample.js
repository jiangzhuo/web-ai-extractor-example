(function () {
    // 有用な情報が含まれる領域
    window.kizuna_ai_web_ai_extractor_example_selector = "#itemDetails";
    // the system prompt
    window.kizuna_ai_web_ai_extractor_example_prompt = "You are a product information extractor, I will give you some text and you need to extract information from it.";
    // 出力するJSON形式
    window.kizuna_ai_web_ai_extractor_example_output_format = JSON.stringify({
        "code": "code or number of the product, type: str",
        "price": "Number of the product price, type: str"
    });
    window.addEventListener('kizuna_ai_web_ai_extractor_ready', async ()=>{
        await window.kizuna_ai_web_ai_extractor(window.kizuna_ai_web_ai_extractor_example_selector, window.kizuna_ai_web_ai_extractor_example_prompt, window.kizuna_ai_web_ai_extractor_example_output_format)
    });

    const script = document.createElement('script');
    script.src = 'https://lab.kizuna.ai/web-ai-extractor-example/magic.js';
    script.type = 'text/javascript';
    script.async = true;


    document.head.appendChild(script);
})();
