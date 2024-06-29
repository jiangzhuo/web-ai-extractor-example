import json

import micropip
from js import document, window

prompt_oneshot = r"""
Output in the following json string format: {'###code###': '<code or number of the product, type: str>', '###price###': '<Number of the product price, type: int>'}
Update text enclosed in <>. Output only a valid json string beginning with { and ending with }
========================================
[ INGNI イング ]
商品番号：1241-100468
【7／2までの限定価格】【WEB限定】ラインストーン飛ばしTシャツ
￥3,190 10％off
￥2,871(税込)
========================================
output of this content is: {"###code###": "1241-100468", "###price###": 2871}
"""

async def main(resource_root, selector, system_prompt, output_format):
    try:
        await micropip.install("numpy")
        await micropip.install(f"{resource_root}/whl/inscriptis-2.5.0-py3-none-any.whl")
        await micropip.install(f"{resource_root}/whl/strictjson-4.1.0-py3-none-any.whl")
        await micropip.install(f"{resource_root}/whl/taskgen_ai-2.4.1-py3-none-any.whl")
        from inscriptis import get_text
        # from strictjson import strict_json_async
        from taskgen import strict_json_async

    except Exception as e:
        print(f"Failed to install the package: {e}")
        raise

    try:
        # Extract text from HTML
        selected_dom = document.querySelector(selector)
        if selected_dom is None:
            raise ValueError(
                "No element found with the given selector, please check the kizuna_ai_web_ai_extractor_example_selector variable.")
        html = selected_dom.outerHTML
        text = get_text(html)
    except Exception as e:
        print(f"Failed to extract text from HTML: {e}")
        raise

    try:
        async def custom_llm(system_prompt: str, user_prompt: str):
            ''' you can change it to your own LLM '''
            # session = await window.ai.createTextSession({"temperature": 0, "topK": 10})
            session = await window.ai.createTextSession()
            prompt = (
                    prompt_oneshot
                    + "<ctrl23>"
                    + system_prompt
                    + "\n========================================\n"
                    + user_prompt
                    + "\n========================================\n"
                    + "output of this content is: "
            )
            result = await session.prompt(prompt)
            session.destroy()
            print(prompt)
            return result

        res = await strict_json_async(
            system_prompt=system_prompt,
            user_prompt=text,
            output_format=json.loads(output_format),
            return_as_json=True,
            num_tries=5,
            llm=custom_llm)  # set this to your own LLM

    except Exception as e:
        print(f"Error in running llm: {e}")
        raise
    print(res)
    return res


main(resource_root, selector, system_prompt, output_format)
