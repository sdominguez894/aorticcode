/**
 * Javascript para manejar las traducciones y interfaz de selección de idioma.
 * Los textos traducidos para cada idioma se almacenan en archivos JSON en la carpeta static/langs/
 */
const langModule = (() => {
    // Idioma actual
    let currentLang = 'ca'; // Se setea el català como idioma inicial

    // Idiomas soportados en la aplicación
    const supportedLanguages = {
        es: { code: "es", name: "Castellano", translationsFile: "es.json", flagFile: "es.svg" },
        ca: { code: "ca", name: "Català", translationsFile: "ca.json", flagFile: "ca.svg" },
        en: { code: "en", name: "English", translationsFile: "en.json", flagFile: "en.svg" }
    };

    // Ruta de las imágenes de las banderas para cada idioma
    const imgsPath = 'static/images/langs/flags/';

    // Ruta de los archivos JSON con las traducciones
    const jsonsPath = 'static/langs/';

    // Diccionario de traducciones del idioma actual
    let translations = {};

    /**
     * Construye el selector de idiomas en la interfaz HTML en el elemento con id 'languageSelectWrapper'
     * 
     * Requiere que exista un listado de idiomas en la variable supportedLanguages y 
     * un elemento con id 'languageSelectWrapper' en el HTML.
     */
    function buildLanguageSelector() 
    {
        // Carreguem com a seleccionat l'idioma actual o el català per defecte
        let selectedLang = supportedLanguages[currentLang] || supportedLanguages['ca'];

        // Construcció del botó i el desplegable d'idiomes
        const languageBtn = `<button id="languageSelectBtn" class="language-select-btn">
                                <img src="${imgsPath}${selectedLang.flagFile}" alt="${selectedLang.name}" class="flag-icon">
                                <span id="selectedLanguageText">${selectedLang.name}</span>
                                <span class="dropdown-arrow">&#9662;</span>
                            </button>`;

        // Construcció del desplegable d'idiomes
        const languagesDropdown = `<ul id="languageDropdown" class="language-dropdown">
                                        ${Object.values(supportedLanguages).map(lang => 
                                            `<li data-lang="${lang.code}">
                                                <img src="${imgsPath}${lang.flagFile}" alt="${lang.name}" class="flag-icon">
                                                ${lang.name}
                                            </li>`)
                                            .join('')}
                                    </ul>`;
        
        document.getElementById('languageSelectWrapper').innerHTML = languageBtn + languagesDropdown;
    }

    /**
     * Carga las traducciones para el idioma especificado desde el archivo JSON correspondiente.
     * 
     * @param {*} langId    Identificador del idioma (ej: 'es', 'ca', 'en')
     * 
     * @returns {Object} Diccionario de traducciones cargado 
     */
    async function loadLanguageTranslations(langId = 'es') 
    {
        try 
        {
            const response = await fetch(`${jsonsPath}${langId}.json`);
            
            if (!response.ok)
            { 
                throw new Error('Idioma no soportado');
            }

            translations = await response.json();
            console.log(`Language loaded: ${translations.lang?.text || langId}`);
        } 
        catch (err) 
        {
            console.error(`Failed to load ${langId}, using Spanish fallback`, err);
            const fallbackResponse = await fetch(`${jsonsPath}es.json`);
            translations = await fallbackResponse.json();
        }

        return translations;
    }

    function replacePlaceholders(text, params = {})
    {
        return text.replace(/\{(\w+)\}/g, (_, key) => params[key] !== undefined ? params[key] : `{${key}}`);
    }

    /**
     * Obtiene la traducción para una clave dada en el diccionario proporcionado.
     * 
     * @param {*} dictionary    Diccionario de traducciones
     * @param {*} key           Clave de traducción (ej: "greeting.hello")
     *
     * @returns     {string|null} Texto traducido o null si no se encuentra 
     */
    function getTranslation(dictionary, key)
    {
        return key.split('.')
                  .reduce( (currentObject, currentProperty) => {
                                return currentObject ? currentObject[currentProperty] : null;
                            }, 
                            dictionary );
    }

    /**
     * Remplaza los parámetros en el texto traducido si se proporcionan.
     * 
     * @param {*} translatedText        Texto traducido con placeholders (ej: "Hola, {name}")
     * @param {*} translationParams     Parámetros en formato JSON (ej: '{"name": "Sergio"}')
     * @param {*} translationKey        Clave de traducción (ej: "greeting.hello") para logging en caso de error  
     * 
     * @returns     {string} Texto con parámetros reemplazados o la clave si no se encuentra traducción
     */
    function replaceTranslationParams(translatedText, translationParams, translationKey)
    {
        if (!translatedText) 
        { 
            return translationKey;
        }

        if (translationParams) 
        {
            try 
            {
                const parsedParams = JSON.parse(translationParams);
                return replacePlaceholders(translatedText, parsedParams);
            } 
            catch (err) 
            {
                console.warn("Error al parsear parámetros de traducción en", translationKey, err);
            }
        }

        return translatedText;
    }

    /**
     * Obtiene el texto traducido para una clave dada, reemplazando los parámetros si se proporcionan.
     * 
     * @param {string} key - Clave de traducción (ej: "greeting.hello")
     * @param {Object} params - Objeto con pares clave-valor para reemplazo (ej: { name: "Sergio" })
     * 
     * @returns {string} Texto traducido con parámetros reemplazados o la clave si no se encuentra traducción
     */
    function getText(key, params = {})
    {
        let translatedText = getTranslation(translations, key);
        translatedText = replaceTranslationParams(translatedText, JSON.stringify(params), key);
        return translatedText || key;
    }

    /**
     * Traduce los elementos HTML que tienen el atributo data-i18n en el idioma actual 
     */
    async function translateHtml()
    {
        translations = await loadLanguageTranslations(currentLang);
        
        let multiLangTexts = document.querySelectorAll("[data-i18n]");
        
        multiLangTexts.forEach( element =>
            {
                const translationKey = element.getAttribute("data-i18n");
                const translationParams = element.getAttribute("data-i18n-params");
                let translatedText = getTranslation( translations, translationKey );
                
                if ( !translatedText )
                {
                    return;
                }
                
                translatedText = replaceTranslationParams(translatedText, translationParams, translationKey);
                element.innerHTML = translatedText;
            } );
    }

    // Carga las traducciones e inicializa la interfaz de selección de idioma al cargar el DOM
    document.addEventListener('DOMContentLoaded', async function ()
    {
        // Construye el selector de idiomas
        buildLanguageSelector();

        translateHtml(translations);

        const languageBtn = document.getElementById('languageSelectBtn');
        const languageDropdown = document.getElementById('languageDropdown');
        const selectedLanguageText = document.getElementById('selectedLanguageText');

        languageBtn.onclick = function (e)
        {
            languageDropdown.style.display = (languageDropdown.style.display === 'block') ? 'none' : 'block';
        };

        languageDropdown.onclick = async function (e)
        {
            if (e.target.closest('li'))
            {
                const li = e.target.closest('li');
                const lang = li.getAttribute('data-lang');
                const img = li.querySelector('img').src;
                const text = li.textContent.trim();
                selectedLanguageText.textContent = text;
                languageBtn.querySelector('img').src = img;
                languageDropdown.style.display = 'none';
                
                currentLang = lang;
                translateHtml();
            }
        };

        document.addEventListener('click', function (e)
        {
            if (!languageBtn.contains(e.target) && !languageDropdown.contains(e.target))
            {
                languageDropdown.style.display = 'none';
            }
        });
    });

    // Exported API
    return {
        getText,
        translateHtml,
        buildLanguageSelector,
        get currentLang() { return currentLang; },
        set currentLang(val) { currentLang = val; },
        get supportedLanguages() { return supportedLanguages; },
        get imgsPath() { return langImgPath; },
        get jsonsPath() { return jsonPath; },
        get translations() { return translations; }
    };
})();

// Export for usage in other scripts
window.langModule = langModule;
