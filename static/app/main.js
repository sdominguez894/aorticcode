// Importar datos de prótesis
import { BranchSide } from '/static/domain/enums/BranchSide.js';
import { BranchType } from '/static/domain/enums/BranchType.js';
import { ProsthesisPort } from '/static/domain/ports/ProsthesisPort.js';
import { BodiesRepository } from '/static/domain/ports/BodiesRepository.js';
import { BranchesRepository } from '/static/domain/ports/BranchesRepository.js';
import { PatientMeasurements } from '/static/domain/entities/PatientMeasurements.js';
import langModule from '/static/app/lang.js';

// Carreguem l'element de resultats
let resultsElement = undefined;

document.addEventListener('DOMContentLoaded', function() {

    resultsElement = document.getElementById( 'results' );

    // Permitir cálculo con Enter
    document.addEventListener('keypress', function(e) {
       
        if (e.key === 'Enter')
        {
            calculateProsthesis();
        }

    });

});

/**
 * Actualitza un valor a l'etiqueta corresponent
 * S'utilitza per superposar a l'esquema anatòmic els valors numèrics omplerts al formulari 
 * 
 * @param   {Event} event   L'esdeveniment d'entrada amb l'element modificat i el nou valor
 */
window.updateImageLabel = function updateImageLabel( event )
{
    // Obtenim l'element modificat (input del formulari)
    let inputField = event.target;

    // Obtenim l'element on mostrar el valor ( etiqueta dins l'esquema anatòmic )
    let IMG_VALUE_SUFFIX = "__imgValue";
    let imgValueContainer = document.getElementById( inputField.id + IMG_VALUE_SUFFIX );

    // Actualitzem el valor per mostrar-lo a l'esquema anatòmic
    imgValueContainer.innerText = inputField.value;
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
window.calculateProsthesis = async function calculateProsthesis()
{
    scrollToResultsSection();

    // Leer y validar inputs
    const inputs = readAndValidateInputs();

    if ( !inputs )
    {
        return;
    }

    // Crear instancia del port y inicialitzar les seves dades
    let prosthesisPort = await new ProsthesisPort( { 
                                                        bodiesRepo: new BodiesRepository(),
                                                        branchesRepo: new BranchesRepository(),
                                                        measurements: new PatientMeasurements( inputs ) 
                                                    })
                                                    .init();

    // Seleccionar cuerpo principal adecuado
    const selectedBody = prosthesisPort.selectMainBody( inputs.neckDiameter );
    
    if ( !selectedBody ) 
    {
        renderMainBodyError(inputs.neckDiameter);
        return;
    }

    // Obtiene opciones de ramas ilíacas compatibles para el lado contralateral e ipsilateral
    const contralateralBranchResults = prosthesisPort.findBranchOptions( inputs.contralateralIliacDiameter,
                                                                         selectedBody.length,
                                                                         selectedBody.shortLeg,
                                                                         inputs.contralateralDistance );
                    
    const ipsilateralBranchResults = prosthesisPort.findBranchOptions( inputs.ipsilateralIliacDiameter,
                                                                       selectedBody.length,
                                                                       selectedBody.longLeg,
                                                                       inputs.ipsilateralDistance );
    
    // Generar HTML completo
    const resultsHtml = [
                            // Genera l'HTML pel cos principal
                            renderSelectedMainBody( selectedBody, inputs.neckDiameter ),
                            
                            // Genera l'HTML pel bloc: Rama Ilíaca Contralateral (Pata Corta)
                            renderBranchSection( BranchSide.CONTRALATERAL, 
                                                 contralateralBranchResults, 
                                                 selectedBody.length, 
                                                 selectedBody.shortLeg, 
                                                 inputs.contralateralDistance, 
                                                 inputs.contralateralIliacDiameter ),
                            
                            // Genera l'HTML pel bloc: Rama Ilíaca Ipsilateral (Pata Larga)
                            renderBranchSection( BranchSide.IPSILATERAL, 
                                                 ipsilateralBranchResults, 
                                                 selectedBody.length, 
                                                 selectedBody.longLeg, 
                                                 inputs.ipsilateralDistance, 
                                                 inputs.ipsilateralIliacDiameter ),
                            
                            // Advertencias según sobredimensionamiento
                            renderWarnings(selectedBody.oversizing)
                        ].join("");

    // Mostrar resultados ( Actualiza el contenido del div 'results' con el HTML generado )
    resultsElement.innerHTML = resultsHtml;
}

/**
 * Navega suavemente a la sección de resultados.
 */
window.scrollToResultsSection = function scrollToResultsSection()
{
    if ( resultsElement )
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

        // Mostrar error en la sección de resultados si hay algún valor inválido
        resultsElement.innerHTML = `<div class="error">
                                        <strong>Error:</strong> <span data-i18n="error.generic">${errorText}</span>
                                    </div>`;
        return null;
    }

    return {
        neckDiameter: neckDiameter,
        contralateralIliacDiameter: contralateralIliacDiameter,
        ipsilateralIliacDiameter: ipsilateralIliacDiameter,
        contralateralDistance: contralateralDistance,
        ipsilateralDistance: ipsilateralDistance
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

    resultsElement.innerHTML = `<div class="error">
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
    return `<div class="result-card">
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
 * @param {object} results Resultado de `findBranchOptions`.
 * @param {number} bodyLength Longitud del cuerpo principal.
 * @param {number} legLength Longitud de la pata.
 * @param {number} totalDistance Distancia total a cubrir.
 * @param {number} iliacDiameter Diámetro ilíaco.
 * 
 * @returns {string} HTML generado.
 */
window.renderBranchSection = function renderBranchSection( side, results, bodyLength, legLength, totalDistance, iliacDiameter )
{
    const isContralateral = side === BranchSide.CONTRALATERAL;

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
    if ( results.options.length > 0 ) 
    {
        // Mostrar hasta 3 opciones
        results.options.slice( 0, 3 )
                       .forEach( ( option, index ) => {
            
            let optionIndex = index + 1;
            let optionDescriptionHtml = buildOptionDescriptionHtml( option );
            let optionTitleText = langModule.getText("branch.option-title", { index: index + 1 });
            let optionDetailsText = langModule.getText("branch.option-details", { totalCoverage: option.totalCoverage, excess: option.excess });
            
            // Opción de rama
            html += `<div class="branch-option">
                        <div class="branch-title">
                            <span data-i18n="branch.option-title" data-i18n-params='{ "index": "${optionIndex}" }'>
                                ${optionTitleText}
                            </span>
                            ${optionDescriptionHtml}
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
        html += `<div class="error">
                    <span data-i18n="error.no-branches" data-i18n-params='{ "iliacDiameter": ${iliacDiameter} }'>
                        ${noBranchesText}
                    </span>
                </div>`;
    }

    // Advertencia si se requiere rama puente
    if ( results.needsBridge )
    {
        let bridgeWarningText = langModule.getText("branch.bridge-warning", { side: side.toLowerCase(), remainingDistance: Math.max(0, results.remainingDistance) });

        html += `<div class="bridge-warning">
                    <span data-i18n="branch.bridge-warning" data-i18n-params='{ "side": "${side.toLowerCase()}", "remainingDistance": "${Math.max(0, results.remainingDistance)}" }'>
                        ${bridgeWarningText}
                    </span>
                </div>`;
    }

    html += `</div>`;

    return html;
}

/**
 * 
 * @param   {BranchOption}  option      Opció (de branca) amb el que montar el text de descripció 
 * 
 * @returns 
 */
window.buildOptionDescriptionHtml = function buildOptionDescriptionHtml( option )
{
    let optionDescriptionText = "";
    let optionHtml = "";

    if( option.type === BranchType.SINGLE )
    {
        let branch = option.branches[0];

        optionDescriptionText = langModule.getText("branch.option-single", { code:       branch.code, 
                                                                             diameter:   branch.diameter, 
                                                                             length:     branch.length, 
                                                                             oversizing: option.oversizing });

        optionHtml = `<span data-i18n="branch.option-single" 
                            data-i18n-params='{ "code": "${branch.code}", "diameter": "${branch.diameter}", "length": "${branch.length}", "oversizing": "${option.oversizing}" }'>
                        ${optionDescriptionText}
                      </span>`;
    }
    else
    {
        let branch1 = option.branches[0];
        let branch2 = option.branches[1];

        optionDescriptionText = langModule.getText("branch.option-double", { code:      `${branch1.code} + ${branch2.code}`, 
                                                                             diameter:   branch1.diameter, 
                                                                             length:     branch1.length + branch2.length - ProsthesisService.MINIMUM_OVERLAP_MM, 
                                                                             oversizing: option.oversizing });

        optionHtml = `<span data-i18n="branch.option-double" 
                            data-i18n-params='{ "code":  "${branch1.code} + ${branch2.code}", "diameter": "${branch1.diameter}", "length": "${branch1.length + branch2.length - ProsthesisService.MINIMUM_OVERLAP_MM}", "oversizing": "${option.oversizing}" }'>
                        ${optionDescriptionText}
                      </span>`;
    }

    return optionHtml;
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