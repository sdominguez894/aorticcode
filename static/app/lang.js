/**
 * Módulo javascript para manejar las traducciones y interfaz de selección de idioma.
 * Los textos traducidos para cada idioma se almacenan en archivos JSON en la carpeta static/langs/
 */

// Idioma actual
let currentLang = 'ca';  // Català by default

 // Idiomas soportados en la aplicación
const supportedLanguages =
{
    es: { code: "es", name: "Castellano", translationsFile: "es.json", flagFile: "es.svg" },
    ca: { code: "ca", name: "Català",   translationsFile: "ca.json", flagFile: "ca.svg" },
    en: { code: "en", name: "English",  translationsFile: "en.json", flagFile: "en.svg" }
};

// Ruta de las imágenes de las banderas para cada idioma
const imgsPath = '/static/images/langs/flags/';

// Ruta de los archivos JSON con las traducciones
const jsonsPath = '/static/langs/';

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
    const wrapper = document.getElementById('languageSelectWrapper');
    if (!wrapper) return;

    // Currently selected language (defaults to català)
    const selectedLang = supportedLanguages[currentLang] || supportedLanguages['ca'];

    // Build main button
    const languageBtn = `
        <button id="languageSelectBtn" class="language-select-btn">
            <img src="${imgsPath}${selectedLang.flagFile}" alt="${selectedLang.name}" class="flag-icon">
            <span id="selectedLanguageText">${selectedLang.name}</span>
            <span class="dropdown-arrow"></span>
        </button>
    `;

    // Build dropdown list
    const languagesDropdown = `
        <ul id="languageDropdown" class="language-dropdown">
            ${Object.values(supportedLanguages).map(lang => `
                <li data-lang="${lang.code}">
                    <img src="${imgsPath}${lang.flagFile}" alt="${lang.name}" class="flag-icon">
                    ${lang.name}
                </li>
            `).join('')}
        </ul>
    `;

    // Insert into DOM
    wrapper.innerHTML = languageBtn + languagesDropdown;
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
        return translations;
    }
    catch (err)
    {
        console.error(`Failed to load ${langId}, using Spanish fallback`, err);

        const fallbackResponse = await fetch(`${jsonsPath}es.json`);
        translations = await fallbackResponse.json();

        return translations;
    }
}


// -----------------------------
// Helper Functions
// -----------------------------

function replacePlaceholders(text, params = {})
{
    return text.replace(/\{(\w+)\}/g, (_, key) =>
        params[key] !== undefined ? params[key] : `{${key}}`
    );
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
    return key.split('.').reduce((obj, prop) =>
        obj ? obj[prop] : null,
        dictionary
    );
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
            const parsedParams = ( typeof translationParams === 'string' ) ? JSON.parse(translationParams)
                                                                           : translationParams;

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
    const translatedText = getTranslation(translations, key);
    return replaceTranslationParams(translatedText, params, key) || key;
}

/**
 * Traduce los elementos HTML que tienen el atributo data-i18n en el idioma actual 
 */
async function translateHtml()
{
    await loadLanguageTranslations(currentLang);

    const multiLangTexts = document.querySelectorAll("[data-i18n]");

    multiLangTexts.forEach(element =>
    {
        const translationKey = element.getAttribute("data-i18n");
        const translationParams = element.getAttribute("data-i18n-params");

        let translatedText = getTranslation(translations, translationKey);

        if (!translatedText)
        {
            return;
        }

        translatedText = replaceTranslationParams(translatedText, translationParams, translationKey);
        element.innerHTML = translatedText;
    });
}


// -----------------------------
// DOM Event Initialization
// // Carga las traducciones e inicializa la interfaz de selección de idioma al cargar el DOM
// -----------------------------
document.addEventListener('DOMContentLoaded', async () =>
{
    // Build selector and perform initial translation
    buildLanguageSelector();
    await translateHtml();

    const languageBtn = document.getElementById('languageSelectBtn');
    const languageDropdown = document.getElementById('languageDropdown');
    const selectedLanguageText = document.getElementById('selectedLanguageText');

    if ( !languageBtn || !languageDropdown || !selectedLanguageText )
    {
        return;
    }

    // Toggle dropdown
    languageBtn.onclick = function ()
    {
        const isOpen = languageDropdown.style.display === 'block';
        languageDropdown.style.display = isOpen ? 'none' : 'block';
        languageBtn.classList.toggle('open', !isOpen);
    };

    // Handle language selection
    languageDropdown.onclick = async function (e)
    {
        const li = e.target.closest('li');
        
        if ( !li )
        {
            return;
        }

        const lang = li.getAttribute('data-lang');
        const img = li.querySelector('img').src;
        const text = li.textContent.trim();

        selectedLanguageText.textContent = text;
        languageBtn.querySelector('img').src = img;
        languageDropdown.style.display = 'none';
        languageBtn.classList.remove('open');

        currentLang = lang;
        await translateHtml();
    };

    // Close dropdown when clicking outside
    document.addEventListener('click', function (e)
    {
        if (!languageBtn.contains(e.target) && !languageDropdown.contains(e.target))
        {
            languageDropdown.style.display = 'none';
            languageBtn.classList.remove('open');
        }
    });
});

// -----------------------------
// Public API (exported object)
// -----------------------------
export const langModule =
{
    getText,
    translateHtml,
    buildLanguageSelector,

    // Expose some state and config
    get currentLang() { return currentLang; },
    set currentLang(val) { currentLang = val; },

    get supportedLanguages() { return supportedLanguages; },
    get imgsPath() { return imgsPath; },
    get jsonsPath() { return jsonsPath; },
    get translations() { return translations; }
};

// Default export (same object)
export default langModule;