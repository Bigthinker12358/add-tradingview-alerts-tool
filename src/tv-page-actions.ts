const fetchFirstXPath = async (selector: string, page, timeout = 20000) => {
    console.warn(`selector: ${selector}`)
    await page.waitForXPath(selector, {timeout})
    const elements = await page.$x(selector)
    return elements[0]
}

export const configureInterval = async (interval: string, page) => {
    await page.waitForTimeout(1000);
    await page.keyboard.press(",")
    await page.waitForTimeout(1000);
    try {
        interval.split("").filter((val) => val !== "m").map((char) => page.keyboard.press(char))
    } catch (e) {
        throw Error("configuration: interval specified incorrectly, should be something like '5m' or '1h' - see documentation")
    }
    await page.waitForTimeout(1000);
    await page.keyboard.press('Enter')
    await page.waitForTimeout(5000);
}

// queries used on the alert conditions
const xpathQueries = {
    primaryLeft: "//*[@class='tv-alert-dialog__group-item tv-alert-dialog__group-item--left js-main-series-select-wrap']/*[@class='tv-control-select__wrap tv-dropdown-behavior tv-control-select--size_small' and 1]/*[@class='tv-control-select__control tv-dropdown-behavior__button' and 1]",
    primaryRight: "//div[@class='tv-alert-dialog__group-item tv-alert-dialog__group-item--right js-main-series-plot-index-select-wrap']/span[@class='tv-control-select__wrap tv-dropdown-behavior tv-control-select--size_small' and 1]/span[@class='tv-control-select__control tv-dropdown-behavior__button' and 1]",
    secondary: "//*[@class='tv-control-fieldset__value tv-alert-dialog__fieldset-value js-condition-operator-input-wrap']/*[@class='tv-control-select__wrap tv-dropdown-behavior tv-control-select--size_small' and 1]/span[@class='tv-control-select__control tv-dropdown-behavior__button' and 1]",
    tertiaryLeft: "//div[@class='tv-alert-dialog__group-item tv-alert-dialog__group-item--left js-second-operand-select-wrap__band-main']/span[@class='tv-control-select__wrap tv-dropdown-behavior tv-control-select--size_small' and 1]/span[@class='tv-control-select__control tv-dropdown-behavior__button' and 1]",
    tertiaryRight: "//div[@class='tv-alert-dialog__group-item tv-alert-dialog__group-item--right js-second-operand-value-wrap__band-main']/span[@class='tv-control-select__wrap tv-dropdown-behavior tv-control-select--size_small' and 1]/span[@class='tv-control-select__control tv-dropdown-behavior__button' and 1]"
}

const inputXpathQueries = {
    tertiaryLeft: "//div[contains(@class, 'tv-alert-dialog__group-item--left ')]//input[contains(@class, 'tv-alert-dialog__number-input')]",
    tertiaryRight: "//div[contains(@class, 'tv-alert-dialog__group-item--right ')]//input[contains(@class, 'tv-alert-dialog__number-input')]"
}


export const login = async (page, username, pass) => {

    // const emailSignInButton = await fetchFirstXPath(`//span[contains(@class, 'tv-signin-dialog__toggle-email')]`, page)
    // emailSignInButton.click()
    // await page.waitForTimeout(400);


    const usernameInput = await fetchFirstXPath('//input[@name=\'username\']', page)
    await usernameInput.type(`${username}`)
    await page.waitForTimeout(8000);

    const passwordInput = await fetchFirstXPath('//input[@name=\'password\']', page)
    await passwordInput.type(`${pass}${String.fromCharCode(13)}`)
    await page.waitForTimeout(8000);

    // await page.evaluate(() => {
    //
    //     alert("login here")
    // })

    // await page.goto("https://www.tradingview.com/u/", {
    //     waitUntil: 'networkidle2'
    // });

    await page.waitForTimeout(8000);

}

export const logout = async (page) => {

    await page.evaluate(() => {

        fetch("/accounts/logout/", {
            method: "POST",
            headers:{accept:"html"},
            credentials:"same-origin"
        }).then(res => {
            console.log("Request complete! response:", res);

        });
    })

    page.on('dialog', async dialog => {
        console.log(dialog.message());
        await dialog.accept();
    });

    await page.reload({
        waitUntil: 'networkidle2'
    });

    await page.waitForTimeout(8000);

}


export const navigateToSymbol = async (page, symbol: string) => {

    const symbolHeaderInput = await fetchFirstXPath('//div[@id="header-toolbar-symbol-search"]', page)
    await symbolHeaderInput.click()
    await page.waitForTimeout(800);
    const symbolInput = await fetchFirstXPath('//input[@data-role=\'search\']', page)
    await symbolInput.type(`  ${symbol}${String.fromCharCode(13)}`)
    await page.waitForTimeout(8000);

}

export const addAlert = async (page, symbol: string, quote: string, base: string, rowName: string, alertConfig: any) => {


    const {condition, option, message} = alertConfig


    await page.keyboard.down('AltLeft')

    await page.keyboard.press("a")

    await page.keyboard.up('AltLeft')


    const selectFromDropDown = async (conditionToMatch) => {

        const selector = "//span[@class='tv-control-select__dropdown tv-dropdown-behavior__body i-opened']//span[@class='tv-control-select__option-wrap']";
        const elements = await page.$x(selector)
        for (const el of elements) {
            const optionText = await page.evaluate(element => element.innerText, el);
            if (optionText.indexOf(conditionToMatch) > -1) {
                //console.debug(" - selecting: ", optionText)
                el.click()
                break;
            }
        }

    }

    for (const [key, xpathQuery] of Object.entries(xpathQueries)) {

        const conditionToMatch = condition[key];
        // console.log("selecting: ", conditionToMatch)
        await page.waitForTimeout(1000);
        if (!!conditionToMatch) {
            let isDropdown = true
            try {
                const targetElement = await fetchFirstXPath(xpathQuery, page, 3000)
                //console.debug("Clicking: ", key)
                targetElement.click()

            } catch (TimeoutError) {
                //console.error(e)
                isDropdown = false
            }
            if (isDropdown) {
                await page.waitForTimeout(1500);
                await selectFromDropDown(conditionToMatch)
            } else {

                //console.log("clicking on input")
                const valueInput = await fetchFirstXPath(inputXpathQueries[key], page, 3000)
                await valueInput.click({clickCount: 3})
                //console.log("planning to type: ", conditionToMatch)
                await valueInput.press('Backspace');
                await valueInput.type(String(conditionToMatch))

            }

        }
    }

    await page.waitForTimeout(400);

    if (!!option) {
        const optionButton = await fetchFirstXPath(`//*[text()='${option}']`, page)
        optionButton.click()
        await page.waitForTimeout(400);
    }

    const alertName = (rowName || alertConfig.name || "").toString().replace(/{{symbol}}/g, symbol).replace(/{{quote}}/g, quote).replace().replace(/{{base}}/g, base).replace()

    if (!!alertName) {
        const nameInput = await fetchFirstXPath("//input[@name='alert-name']", page)
        nameInput.click()
        await nameInput.press('Backspace');
        await nameInput.type(alertName)
        await page.waitForTimeout(800);
    }


    if (!!message) {
        const messageTextarea = await fetchFirstXPath("//textarea[@class='tv-control-textarea']", page)

        messageTextarea.click({clickCount: 3})

        await page.waitForTimeout(500);
        await messageTextarea.press('Backspace');
        await page.waitForTimeout(500);

        const messageText = message.toString().replace(/{{quote}}/g, quote).replace(/{{base}}/g, base)

        await messageTextarea.type(messageText)
    }


    await page.waitForTimeout(1000);
    const continueButton = await fetchFirstXPath("//span[@class='tv-button__loader']", page)
    continueButton.click()

    await page.waitForTimeout(2000);

    try {
        const continueAnywayButton = await fetchFirstXPath("//*[text()='Continue anyway']", page, 3000)
        continueAnywayButton.click()
        await page.waitForTimeout(5000);
    } catch (error) {
        //must not be alert on an indicator
    }


}
