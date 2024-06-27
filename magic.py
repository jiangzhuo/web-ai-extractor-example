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
            prompt = system_prompt + "\n====================\n" + user_prompt
            result = await session.prompt(prompt)
            print(result)
            return result

        res = await strict_json_async(
            system_prompt=kizuna_ai_web_ai_extractor_example_prompt,
            user_prompt=text,
            output_format=json.loads(kizuna_ai_web_ai_extractor_example_output_format),
            return_as_json=True,
            llm_async=custom_llm)  # set this to your own LLM

    except Exception as e:
        print(f"Error in running llm: {e}")
        raise
    print(res)
    return res


main()
