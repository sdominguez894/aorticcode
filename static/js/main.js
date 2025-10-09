// Importar datos de prótesis
import { bodies } from '../data/bodies.js';
import { branches } from '../data/branches.js';

// Solapamiento mínimo
const SOLAPAMIENTO_MINIMO = 30; // mm

/**
 * Actualitza l'etiqueta superposada a una imatge amb el valor d'un input.
 * 
 * @param   {Event} event   L'esdeveniment d'entrada modificat.
 */
window.updateImageLabel = function updateImageLabel( event )
{
    // Obtenim l'element modificat
    let inputField = event.target;

    // Obtenim l'element on mostrar el valor del camp superposat a la imatge
    let IMG_VALUE_SUFFIX = "__imgValue";
    let imgValueContainer = document.getElementById( inputField.id + IMG_VALUE_SUFFIX );

    // Actualitzem el valor
    imgValueContainer.innerText = inputField.value;
}

/**
 * Reemplaza los placeholders {param} en el texto traducido.
 *
 * @param {string} text - Texto con placeholders (ej: "Hola, {name}")
 * @param {Object} params - Objeto con pares clave-valor para reemplazo (ej: { name: "Sergio" })
 * @returns {string} Texto con parámetros reemplazados
 */
function replacePlaceholders(text, params = {}) {
  return text.replace(/\{(\w+)\}/g, (_, key) => params[key] !== undefined ? params[key] : `{${key}}`);
}

/**
 * Selecciona el cuerpo principal de la prótesis con un sobredimensionamiento entre 10% y 30%.
 * @param {number} neckDiameter Diámetro del cuello aórtico.
 * @returns {object|null} Cuerpo seleccionado o null si no hay opción válida.
 */
window.selectProsthesisMainBody = function selectProsthesisMainBody(neckDiameter) {
    // Calcular el rango permitido de diámetros del cuerpo (10% - 30% más que el cuello)
    const minAllowedDiameter = neckDiameter * 1.10;
    const maxAllowedDiameter = neckDiameter * 1.30;
    
    // Filtrar cuerpos que cumplan con el rango de sobredimensionamiento
    const suitableBodies = bodies.filter(body => 
        body.diameter >= minAllowedDiameter && body.diameter <= maxAllowedDiameter
    );
    
    // Si no hay cuerpos válidos, devolver null
    if (suitableBodies.length === 0) {
        return null;
    }
    
    // Seleccionar el primer cuerpo válido (el de menor diámetro compatible)
    const selectedBody = suitableBodies[0];
    
    // Devolver el cuerpo con el cálculo adicional de sobredimensionamiento
    return {
        ...selectedBody,
        oversizing: ((selectedBody.diameter / neckDiameter - 1) * 100).toFixed(1)
    };
}

/**
 * Encuentra opciones de ramas ilíacas con sobredimensionamiento adecuado para cubrir la distancia requerida.
 * 
 * @param {number} targetDiameter Diámetro ilíaco objetivo.
 * @param {number} bodyLength Longitud del cuerpo principal.
 * @param {number} legLength Longitud de la pata.
 * @param {number} totalDistance Distancia total a cubrir.
 * 
 * @returns {object} Opciones encontradas, necesidad de puente y distancia restante.
 */
window.findBranchOptions = function findBranchOptions(targetDiameter, bodyLength, legLength, totalDistance) {
    // Calcular sobredimensionamiento permitido (entre 10% y 30%)
    const minAllowedDiameter = targetDiameter * 1.10;
    const maxAllowedDiameter = targetDiameter * 1.30;

    // Filtrar ramas compatibles por diámetro
    const suitableBranches = branches.filter(branch =>
        branch.diameter >= minAllowedDiameter && branch.diameter <= maxAllowedDiameter
    );

    // Calcular cobertura actual (cuerpo + pata)
    const currentCoverage = bodyLength + legLength;

    // Distancia adicional a cubrir con ramas (se suma 30mm por el solapamiento con la pata)
    const remainingDistance = totalDistance - currentCoverage + SOLAPAMIENTO_MINIMO;

    const options = [];

    // OPCIÓN 1: Rama única
    suitableBranches.forEach( branch => {
        const totalCoverage = currentCoverage + branch.length - SOLAPAMIENTO_MINIMO; // Se resta solapamiento con pata

        if (totalCoverage >= totalDistance) 
        {
            const oversizing = ( (branch.diameter / targetDiameter - 1) * 100 ).toFixed(1);

            let singleBranchText = langModule.getText("branch.option-single", { code: branch.code, diameter: branch.diameter, length: branch.length, oversizing: oversizing });

            options.push({
                type: 'single',
                branches: [branch],
                totalCoverage: totalCoverage,
                excess: totalCoverage - totalDistance,
                oversizing: oversizing,
                description: singleBranchText
            });
        }
    });

    // OPCIÓN 2: Dos ramas (para mayor cobertura)
    for (let i = 0; i < suitableBranches.length; i++) 
    {
        for (let j = 0; j < suitableBranches.length; j++) 
        {
            const branch1 = suitableBranches[i];
            const branch2 = suitableBranches[j];

            // Solo combinar si tienen el mismo diámetro
            if (branch1.diameter === branch2.diameter)
            {
                // Total cobertura de ambas ramas (con dos solapamientos)
                const totalCoverage = currentCoverage + branch1.length + branch2.length - 60;

                // Verificar si cubren la distancia y aportan suficiente longitud combinada
                if (
                    totalCoverage >= totalDistance &&
                    ( branch1.length + branch2.length - SOLAPAMIENTO_MINIMO ) > remainingDistance
                ) 
                {
                    const oversizing = ((branch1.diameter / targetDiameter - 1) * 100).toFixed(1);
                    
                    let doubleBranchText = langModule.getText("branch.option-double", { code: `${branch1.code} + ${branch2.code}`, 
                                                                                        diameter: branch1.diameter, 
                                                                                        length: branch1.length + branch2.length - SOLAPAMIENTO_MINIMO, 
                                                                                        oversizing: oversizing });

                    options.push({
                        type: 'double',
                        branches: [branch1, branch2],
                        totalCoverage: totalCoverage,
                        excess: totalCoverage - totalDistance,
                        oversizing: oversizing,
                        description: doubleBranchText
                    });
                }
            }
        }
    }

    // Determinar si se requiere rama puente
    const needsBridge = options.length === 0 ||
                        remainingDistance > Math.max(...suitableBranches.map(b => b.length), 0);

    // Ordenar opciones por el menor exceso de cobertura
    return {
        options: options.sort((a, b) => a.excess - b.excess),
        needsBridge: needsBridge,
        remainingDistance: remainingDistance,
        suitableBranches: suitableBranches
    };
}

/**
 * Obtiene el valor de un elemento dado su id.
 * 
 * @param   {string} id Identificador del elemento.
 * 
 * @returns {string} Valor actual del input.
 */
window.getValue = function getValue(id)
{
    // Obtiene el elemento por id y retorna su valor
    return document.getElementById(id).value;
}

/**
 * Calcula las prótesis según las médidas anatómicas y muestra los resultados en la página.
 */
window.calculateProsthesis = function calculateProsthesis()
{
    scrollToResultsSection();

    // Leer y validar inputs
    const inputs = readAndValidateInputs();

    if (!inputs)
    {
        return;
    } 

    // Seleccionar cuerpo principal adecuado
    const selectedBody = selectProsthesisMainBody(inputs.neckDiameter);
    
    if (!selectedBody) 
    {
        renderMainBodyError(inputs.neckDiameter);
        return;
    }

    // Calcular opciones de ramas
    const contralateral = findBranchOptions( inputs.contralateralIliacDiameter,
                                             selectedBody.length,
                                             selectedBody.shortLeg,
                                             inputs.contralateralDistance );

    const ipsilateral = findBranchOptions( inputs.ipsilateralIliacDiameter,
                                           selectedBody.length,
                                           selectedBody.longLeg,
                                           inputs.ipsilateralDistance );

    // Generar HTML completo
    const html = [
                    // Cuerpo principal
                    renderSelectedMainBody( selectedBody, inputs.neckDiameter ),
                    
                    // Rama Ilíaca Contralateral (Pata Corta)
                    renderBranchSection("Contralateral", contralateral, selectedBody.length, selectedBody.shortLeg, inputs.contralateralDistance, inputs.contralateralIliacDiameter),
                    
                    // Rama Ilíaca Ipsilateral (Pata Larga)
                    renderBranchSection("Ipsilateral", ipsilateral, selectedBody.length, selectedBody.longLeg, inputs.ipsilateralDistance, inputs.ipsilateralIliacDiameter),
                    
                    // Advertencias según sobredimensionamiento
                    renderWarnings(selectedBody.oversizing)
                ].join("");

    // Mostrar resultados
    document.getElementById('results').innerHTML = html;
}

/**
 * Navega suavemente a la sección de resultados.
 */
window.scrollToResultsSection = function scrollToResultsSection()
{
    const resultsElement = document.getElementById("results");
    
    if (resultsElement)
    {
        resultsElement.scrollIntoView({ behavior: "smooth" });
    }
}

/**
 * Lee y valida los valores del formulario.
 * 
 * @returns {object|null} Valores válidos o null si hay error.
 */
window.readAndValidateInputs = function readAndValidateInputs()
{
    // Leer valores desde el DOM
    const neckDiameter               = parseFloat( getValue('neckDiameter') );
    const contralateralIliacDiameter = parseFloat( getValue('contralateralIliacDiameter') );
    const ipsilateralIliacDiameter   = parseFloat( getValue('ipsilateralIliacDiameter') );
    const contralateralDistance      = parseInt( getValue('contralateralDistance') );
    const ipsilateralDistance        = parseInt( getValue('ipsilateralDistance') );

    // Verificar que todos sean números válidos
    const isInvalid = [
        neckDiameter,
        contralateralIliacDiameter,
        ipsilateralIliacDiameter,
        contralateralDistance,
        ipsilateralDistance
    ].some(value => isNaN(value));

    if (isInvalid)
    {
        let errorText = langModule.getText("error.generic");

        // Mostrar error si hay algún campo inválido
        document.getElementById('results').innerHTML = `
            <div class="error">
                <strong>Error:</strong> <span data-i18n="error.generic">${errorText}</span>
            </div>
        `;
        return null;
    }

    return {
        neckDiameter,
        contralateralIliacDiameter,
        ipsilateralIliacDiameter,
        contralateralDistance,
        ipsilateralDistance
    };
}

/**
 * Muestra un mensaje de error si no hay cuerpo compatible.
 * 
 * @param {number} neckDiameter Diámetro del cuello.
 */
window.renderMainBodyError = function renderMainBodyError(neckDiameter)
{
    let noMainBodyText = langModule.getText("error.no-main-body", { neckDiameter: neckDiameter });

    document.getElementById('results').innerHTML = `<div class="error">
                                                        <span data-i18n="error.no-main-body" data-i18n-params='{ "neckDiameter": ${neckDiameter} }'>
                                                            ${noMainBodyText}
                                                        </span>
                                                    </div>`;
}

/**
 * Genera HTML del cuerpo principal seleccionado.
 * 
 * @param {object} selectedBody Objeto del cuerpo principal.
 * @param {number} neckDiameter Diámetro del cuello.
 * 
 * @returns {string} HTML del cuerpo.
 */
window.renderSelectedMainBody = function renderSelectedMainBody(selectedBody, neckDiameter)
{
    let mainBodyText = langModule.getText("main-body.title");
    let diameterText = langModule.getText("main-body.diameter", { bodyDiameter: selectedBody.diameter, neckDiameter: neckDiameter, oversizing: selectedBody.oversizing });
    let bodyLengthText = langModule.getText("main-body.length", { bodyLength: selectedBody.length });
    let legsText = langModule.getText("main-body.legs", { shortLeg: selectedBody.shortLeg, longLeg: selectedBody.longLeg });

    // Mostrar información detallada del cuerpo principal
    return `
        <div class="result-card">
            <div class="result-title">
                🎯 <span data-i18n="main-body.title">${mainBodyText}</span>
            </div>
            <div class="prosthesis-info">
                <div class="prosthesis-code">
                    ${selectedBody.code}
                </div>
                <div>
                    <span data-i18n="main-body.diameter" data-i18n-params='{ "bodyDiameter": "${selectedBody.diameter}", "neckDiameter": "${neckDiameter}", "oversizing": "${selectedBody.oversizing}" }'>
                        ${diameterText}
                    </span>
                </div>
                <div>
                    <span data-i18n="main-body.length" data-i18n-params='{ "bodyLength": "${selectedBody.length}" }'>
                        ${bodyLengthText}
                    </span>
                </div>
                <div>
                    <span data-i18n="main-body.legs" data-i18n-params='{ "shortLeg": "${selectedBody.shortLeg}", "longLeg": "${selectedBody.longLeg}" }'>
                        ${legsText}
                    </span>
                </div>
            </div>
        </div>`;
}

/**
 * Genera la sección HTML para una rama ilíaca.
 * 
 * @param {string} side "Contralateral" o "Ipsilateral".
 * @param {object} result Resultado de `findBranchOptions`.
 * @param {number} bodyLength Longitud del cuerpo principal.
 * @param {number} legLength Longitud de la pata.
 * @param {number} totalDistance Distancia total a cubrir.
 * @param {number} iliacDiameter Diámetro ilíaco.
 * 
 * @returns {string} HTML generado.
 */
window.renderBranchSection = function renderBranchSection( side, result, bodyLength, legLength, totalDistance, iliacDiameter )
{
    /*
    "contralateral": "Contralateral",
    "leg": "Pata",
    "short-leg": "corta",
    "long-leg": "larga", 
    "title": "Rama Ilíaca {side} (Pata {branchLabel})",
    "total-distance": "<strong>Distancia total a cubrir:</strong> {totalDistance}mm",
    "coverage": "<strong>Cobertura del cuerpo + pata {branchLabel}</strong>: {totalCoverage}mm",
    */

    const isContralateral = side === "Contralateral";

    // Si es contralateral -> corta; si ipsilateral -> larga
    const branchLabel = isContralateral ? langModule.getText( "branch.short-leg" ) : 
                                          langModule.getText( "branch.long-leg" );
    
    // Rama Ilíaca Contralateral (Pata Corta)
    // Rama Ilíaca Ipsilateral (Pata Larga)
    const totalCoverage = bodyLength + legLength;

    let branchTitleText = langModule.getText("branch.title", { side: side, branchLabel: branchLabel });
    let brancDistanceText = langModule.getText("branch.total-distance", { totalDistance: totalDistance });
    let coverageText = langModule.getText("branch.coverage", { branchLabel: branchLabel, totalCoverage: totalCoverage });
    let noteText = langModule.getText("branch.note");

    // Bloque sección de rama ilíaca
    let html = `<div class="result-card">`;
    
    // Título y resumen
    html += `<div class="result-title">
                ↔️
                <span data-i18n="branch.title" data-i18n-params='{ "side": "${side}", "branchLabel": "${branchLabel}" }'>
                    ${branchTitleText}
                </span>
            </div>
            <div style="margin-bottom: 15px;">
                <span data-i18n="branch.total-distance" data-i18n-params='{ "totalDistance": "${totalDistance}" }'>
                    ${brancDistanceText}
                </span>
                <br>
                <span data-i18n="branch.coverage" data-i18n-params='{ "branchLabel": "${branchLabel}", "totalCoverage": "${totalCoverage}" }'>
                    ${coverageText}
                </span>
                <br>
                <span class="note" data-i18n="branch.note">
                    ${noteText}
                </span>
            </div>`;

    // Mostrar opciones disponibles
    if (result.options.length > 0) 
    {
        // Mostrar hasta 3 opciones
        result.options.slice( 0, 3 )
                      .forEach( ( option, index ) => {
            
            let optionIndex = index + 1;
            let optionTitleText = langModule.getText("branch.option-title", { index: index + 1, description: option.description });
            let optionDetailsText = langModule.getText("branch.option-details", { totalCoverage: option.totalCoverage, excess: option.excess });
            
            // Opción de rama
            html += `<div class="branch-option">
                        <div class="branch-title">
                            <span data-i18n="branch.option-title" data-i18n-params='{ "index": "${optionIndex}", "description": "${option.description}" }'>
                                ${optionTitleText}
                            </span>
                        </div>
                        <div class="branch-details">
                            <span data-i18n="branch.option-details" data-i18n-params='{ "totalCoverage": "${option.totalCoverage}", "excess": "${option.excess}" }'>
                                ${optionDetailsText}
                            </span>
                        </div>
                    </div>`;
        });
    }
    else
    {
        let noBranchesText = langModule.getText("error.no-branches", { iliacDiameter: iliacDiameter });

        // Si no hay opciones disponibles se muestra un mensaje de error
        html += `
            <div class="error">
                <span data-i18n="error.no-branches" data-i18n-params='{ "iliacDiameter": ${iliacDiameter} }'>
                    ${noBranchesText}
                </span>
            </div>
        `;
    }

    // Advertencia si se requiere rama puente
    if (result.needsBridge)
    {
        let bridgeWarningText = langModule.getText("branch.bridge-warning", { side: side.toLowerCase(), remainingDistance: Math.max(0, result.remainingDistance) });

        html += `
            <div class="bridge-warning">
                <span data-i18n="branch.bridge-warning" data-i18n-params='{ "side": "${side.toLowerCase()}", "remainingDistance": "${Math.max(0, result.remainingDistance)}" }'>
                    ${bridgeWarningText}
                </span>
            </div>
        `;
    }

    html += `</div>`;

    return html;
}

/**
 * Genera advertencias según el sobredimensionamiento.
 * 
 * @param {number} oversizing Porcentaje de sobredimensionamiento.
 * 
 * @returns {string} HTML con advertencias.
 */
window.renderWarnings = function renderWarnings(oversizing)
{
    let html = '';

    let warningText = langModule.getText("warnings.warning");

    if ( oversizing > 25 )
    {
        let warningOversizingHighText = langModule.getText("warnings.oversizing-high", { oversizing: oversizing });
        
        html += `<div class="warning">
                    <span data-i18n="warnings.warning">
                        ${warningText}
                    </span>
                    <span data-i18n="warnings.oversizing-high" data-i18n-params='{ "oversizing": "${oversizing}" }'>
                        ${warningOversizingHighText}
                    </span>
                </div>`;
    }

    if ( oversizing < 10 )
    {
        let warningOversizingLowText = langModule.getText("warnings.oversizing-low", { oversizing: oversizing });

        html += `<div class="warning">
                    <span data-i18n="warnings.warning">
                        ${warningText}
                    </span> 
                    <span data-i18n="warnings.oversizing-low" data-i18n-params='{ "oversizing": "${oversizing}" }'>
                        ${warningOversizingLowText}
                    </span>
                </div>`;
    }

    return html;
}

// Permitir cálculo con Enter
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter')
    {
        calculateProsthesis();
    }
});