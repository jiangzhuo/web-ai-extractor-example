import json

import micropip
from js import document, kizuna_ai_web_ai_extractor_example_root, kizuna_ai_web_ai_extractor_example_selector, \
    kizuna_ai_web_ai_extractor_example_prompt, kizuna_ai_web_ai_extractor_example_output_format, window


async def main():
    try:
        await micropip.install("numpy")
        await micropip.install(f"{kizuna_ai_web_ai_extractor_example_root}/whl/inscriptis-2.5.0-py3-none-any.whl")
        await micropip.install(f"{kizuna_ai_web_ai_extractor_example_root}/whl/strictjson-4.1.0-py3-none-any.whl")
        await micropip.install(f"{kizuna_ai_web_ai_extractor_example_root}/whl/taskgen_ai-2.4.1-py3-none-any.whl")
        from inscriptis import get_text
        # from strictjson import strict_json_async
        from taskgen import strict_json_async

    except Exception as e:
        print(f"Failed to install the package: {e}")
        raise

    try:
        # Extract text from HTML
        selected_dom = document.querySelector(kizuna_ai_web_ai_extractor_example_selector)
        if selected_dom is None:
            raise ValueError("No element found with the given selector, please check the window.kizuna_ai_web_ai_extractor_example_selector variable.")
        html = selected_dom.outerHTML
        text = get_text(html)
    except Exception as e:
        print(f"Failed to extract text from HTML: {e}")
        raise

    try:
        async def custom_llm(system_prompt: str, user_prompt: str):
            ''' you can change it to your own LLM '''
            print(system_prompt)
            session = await window.ai.createTextSession()
            prompt = (system_prompt
                      + "<ctrl23>"
                        r"""Output in the following json string format: {'###code###': '<code or number of the product, type: str>', '###price###': '<Number of the product price, type: str>'}
                        Update text enclosed in <>. Output only a valid json string beginning with { and ending with }
                        商品番号：1241-100468
                        output of this content is: {"###code###": "1241-100468"}
                        """
                      + "<ctrl23>"
                      + user_prompt)
            result = await session.prompt(prompt)
            session.destroy()
            print(result)
            return result

        res = await strict_json_async(
            system_prompt=kizuna_ai_web_ai_extractor_example_prompt,
            user_prompt=text,
            output_format=json.loads(kizuna_ai_web_ai_extractor_example_output_format),
            return_as_json=True,
            llm=custom_llm)  # set this to your own LLM

    except Exception as e:
        print(f"Error in running llm: {e}")
        raise
    print(res)
    return res


main()
