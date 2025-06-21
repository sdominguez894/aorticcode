  // Catálogo de prótesis con correcciones de longitud de patas
const bodies = [
    { code: 'CXT201412E', diameter: 20, length: 55, shortLeg: 30, longLeg: 65 },
    { code: 'CXT231412E', diameter: 23, length: 55, shortLeg: 30, longLeg: 65 },
    { code: 'CXT261412E', diameter: 26, length: 55, shortLeg: 30, longLeg: 65 },
    { code: 'CXT281412E', diameter: 28.5, length: 55, shortLeg: 30, longLeg: 65 },
    { code: 'CXT321414E', diameter: 32, length: 65, shortLeg: 30, longLeg: 75 },
    { code: 'CXT361414E', diameter: 36, length: 65, shortLeg: 30, longLeg: 75 }
];

const branches = [
    { code: 'PLC121000', diameter: 12, length: 100 },
    { code: 'PLC121200', diameter: 12, length: 120 },
    { code: 'PLC121400', diameter: 12, length: 140 },
    { code: 'PLC141000', diameter: 14.5, length: 100 },
    { code: 'PLC141200', diameter: 14.5, length: 120 },
    { code: 'PLC141400', diameter: 14.5, length: 140 },
    { code: 'PLC161000', diameter: 16, length: 95 },
    { code: 'PLC161200', diameter: 16, length: 115 },
    { code: 'PLC161400', diameter: 16, length: 135 },
    { code: 'PLC181000', diameter: 18, length: 95 },
    { code: 'PLC181200', diameter: 18, length: 115 },
    { code: 'PLC181400', diameter: 18, length: 135 },
    { code: 'PLC201000', diameter: 20, length: 95 },
    { code: 'PLC201200', diameter: 20, length: 115 },
    { code: 'PLC201400', diameter: 20, length: 135 },
    { code: 'PLC231000', diameter: 23, length: 100 },
    { code: 'PLC231200', diameter: 23, length: 120 },
    { code: 'PLC231400', diameter: 23, length: 140 },
    { code: 'PLC271000', diameter: 27, length: 100 },
    { code: 'PLC271200', diameter: 27, length: 120 },
    { code: 'PLC271400', diameter: 27, length: 140 }
];

function selectMainBody(neckDiameter) {
    // Buscar cuerpos con sobredimensionamiento entre 10% y 30%
    const minAllowedDiameter = neckDiameter * 1.10;
    const maxAllowedDiameter = neckDiameter * 1.30;
    
    // Filtrar cuerpos que estén entre 10% y 30% de sobredimensionamiento
    const suitableBodies = bodies.filter(body => 
        body.diameter >= minAllowedDiameter && body.diameter <= maxAllowedDiameter
    );
    
    if (suitableBodies.length === 0) {
        return null; // No hay cuerpo disponible
    }
    
    // Seleccionar el menor que sea adecuado
    const selectedBody = suitableBodies[0];
    return {
        ...selectedBody,
        oversizing: ((selectedBody.diameter / neckDiameter - 1) * 100).toFixed(1)
    };
}

function findBranchOptions(targetDiameter, bodyLength, legLength, totalDistance) {
    // Aplicar sobredimensionamiento entre 10% y 30% para sellado ilíaco
    const minAllowedDiameter = targetDiameter * 1.10;
    const maxAllowedDiameter = targetDiameter * 1.30;
    
    // Filtrar ramas que estén entre 10% y 30% de sobredimensionamiento
    const suitableBranches = branches.filter(branch => 
        branch.diameter >= minAllowedDiameter && branch.diameter <= maxAllowedDiameter
    );
    
    // Calcular cobertura actual del cuerpo + pata
    const currentCoverage = bodyLength + legLength;
    const remainingDistance = totalDistance - currentCoverage + 30; // +30 por el solapamiento con la pata
    
    const options = [];
    
    // Opción 1: Rama única
    suitableBranches.forEach(branch => {
        const totalCoverage = currentCoverage + branch.length - 30; // -30 por solapamiento pata-rama
        if (totalCoverage >= totalDistance) {
            const oversizing = ((branch.diameter / targetDiameter - 1) * 100).toFixed(1);
            options.push({
                type: 'single',
                branches: [branch],
                totalCoverage: totalCoverage,
                excess: totalCoverage - totalDistance,
                oversizing: oversizing,
                description: `Rama única: ${branch.code} (Ø${branch.diameter}mm, L${branch.length}mm, +${oversizing}%)`
            });
        }
    });
    
    // Opción 2: Múltiples ramas (para casos que requieren mayor longitud)
    for (let i = 0; i < suitableBranches.length; i++) {
        for (let j = 0; j < suitableBranches.length; j++) {
            const branch1 = suitableBranches[i];
            const branch2 = suitableBranches[j];
            
            // Verificar que ambas ramas tengan el mismo diámetro para conectarse
            if (branch1.diameter === branch2.diameter) {
                const totalCoverage = currentCoverage + branch1.length + branch2.length - 60; // -30 pata-rama1, -30 rama1-rama2
                if (totalCoverage >= totalDistance && branch1.length + branch2.length - 30 > remainingDistance) {
                    const oversizing = ((branch1.diameter / targetDiameter - 1) * 100).toFixed(1);
                    options.push({
                        type: 'double',
                        branches: [branch1, branch2],
                        totalCoverage: totalCoverage,
                        excess: totalCoverage - totalDistance,
                        oversizing: oversizing,
                        description: `Doble rama: ${branch1.code} + ${branch2.code} (Ø${branch1.diameter}mm, +${oversizing}%)`
                    });
                }
            }
        }
    }
    
    // Verificar si se necesita puente
    const needsBridge = options.length === 0 || remainingDistance > Math.max(...suitableBranches.map(b => b.length));
    
    // Ordenar por exceso menor (preferir las que se ajusten mejor)
    return {
        options: options.sort((a, b) => a.excess - b.excess),
        needsBridge: needsBridge,
        remainingDistance: remainingDistance,
        suitableBranches: suitableBranches
    };
}

function calculateProsthesis() {
    const neckDiameter = parseFloat(document.getElementById('neckDiameter').value);
    const contralateralIliacDiameter = parseFloat(document.getElementById('contralateralIliacDiameter').value);
    const ipsilateralIliacDiameter = parseFloat(document.getElementById('ipsilateralIliacDiameter').value);
    const contralateralDistance = parseInt(document.getElementById('contralateralDistance').value);
    const ipsilateralDistance = parseInt(document.getElementById('ipsilateralDistance').value);

    const resultsDiv = document.getElementById('results');

    // Validar entrada
    if (isNaN(neckDiameter) || isNaN(contralateralIliacDiameter) || isNaN(ipsilateralIliacDiameter) || 
        isNaN(contralateralDistance) || isNaN(ipsilateralDistance)) {
        resultsDiv.innerHTML = `
            <div class="error">
                <strong>Error:</strong> Por favor, completa todos los campos con valores numéricos válidos.
            </div>
        `;
        return;
    }

    // Seleccionar cuerpo principal
    const selectedBody = selectMainBody(neckDiameter);
    if (!selectedBody) {
        resultsDiv.innerHTML = `
            <div class="error">
                <strong>Error:</strong> No hay cuerpo principal disponible para un diámetro de cuello de ${neckDiameter}mm con sobredimensionamiento entre 10% y 30%.
                <br>Considere alternativas quirúrgicas o dispositivos de diferente diámetro.
            </div>
        `;
        return;
    }

    // Calcular opciones de ramas
    const contralateralResult = findBranchOptions(contralateralIliacDiameter, selectedBody.length, selectedBody.shortLeg, contralateralDistance);
    const ipsilateralResult = findBranchOptions(ipsilateralIliacDiameter, selectedBody.length, selectedBody.longLeg, ipsilateralDistance);

    // Generar resultados
    let resultsHTML = `
        <div class="result-card">
            <div class="result-title">🎯 Cuerpo Principal Seleccionado</div>
            <div class="prosthesis-info">
                <div class="prosthesis-code">${selectedBody.code}</div>
                <div>Diámetro: ${selectedBody.diameter}mm (Cuello: ${neckDiameter}mm, Sobredimensionamiento: +${selectedBody.oversizing}%)</div>
                <div>Longitud del cuerpo: ${selectedBody.length}mm</div>
                <div>Pata contralateral: ${selectedBody.shortLeg}mm | Pata ipsilateral: ${selectedBody.longLeg}mm</div>
            </div>
        </div>
    `;

    // Rama contralateral (conecta con pata corta)
    resultsHTML += `
        <div class="result-card">
            <div class="result-title">↔️ Rama Ilíaca Contralateral (Pata Corta)</div>
            <div style="margin-bottom: 15px;">
                <strong>Distancia total a cubrir:</strong> ${contralateralDistance}mm
                <br><strong>Cobertura del cuerpo + pata contralateral:</strong> ${selectedBody.length + selectedBody.shortLeg}mm
                <br><small>Necesaria extensión con ramas (considerando solapamiento de 30mm)</small>
            </div>
    `;

    if (contralateralResult.options.length > 0) {
        contralateralResult.options.slice(0, 3).forEach((option, index) => {
            resultsHTML += `
                <div class="branch-option">
                    <div class="branch-title">Opción ${index + 1}: ${option.description}</div>
                    <div class="branch-details">
                        Cobertura total: ${option.totalCoverage}mm | Exceso: ${option.excess}mm
                    </div>
                </div>
            `;
        });
    } else {
        resultsHTML += `
            <div class="error">
                No hay ramas disponibles para diámetro ${contralateralIliacDiameter}mm con sobredimensionamiento entre 10% y 30%
            </div>
        `;
    }

    if (contralateralResult.needsBridge) {
        resultsHTML += `
            <div class="bridge-warning">
                <strong>⚠️ Atención:</strong> Se requiere rama puente adicional para cubrir la distancia completa en lado contralateral.
                <br>Distancia restante estimada: ~${Math.max(0, contralateralResult.remainingDistance)}mm
            </div>
        `;
    }

    resultsHTML += `</div>`;

    // Rama ipsilateral (conecta con pata larga)
    resultsHTML += `
        <div class="result-card">
            <div class="result-title">↔️ Rama Ilíaca Ipsilateral (Pata Larga)</div>
            <div style="margin-bottom: 15px;">
                <strong>Distancia total a cubrir:</strong> ${ipsilateralDistance}mm
                <br><strong>Cobertura del cuerpo + pata ipsilateral:</strong> ${selectedBody.length + selectedBody.longLeg}mm
                <br><small>Necesaria extensión con ramas (considerando solapamiento de 30mm)</small>
            </div>
    `;

    if (ipsilateralResult.options.length > 0) {
        ipsilateralResult.options.slice(0, 3).forEach((option, index) => {
            resultsHTML += `
                <div class="branch-option">
                    <div class="branch-title">Opción ${index + 1}: ${option.description}</div>
                    <div class="branch-details">
                        Cobertura total: ${option.totalCoverage}mm | Exceso: ${option.excess}mm
                    </div>
                </div>
            `;
        });
    } else {
        resultsHTML += `
            <div class="error">
                No hay ramas disponibles para diámetro ${ipsilateralIliacDiameter}mm con sobredimensionamiento entre 10% y 30%
            </div>
        `;
    }

    if (ipsilateralResult.needsBridge) {
        resultsHTML += `
            <div class="bridge-warning">
                <strong>⚠️ Atención:</strong> Se requiere rama puente adicional para cubrir la distancia completa en lado ipsilateral.
                <br>Distancia restante estimada: ~${Math.max(0, ipsilateralResult.remainingDistance)}mm
            </div>
        `;
    }

    resultsHTML += `</div>`;

    // Advertencias
    let warningHTML = '';
    if (parseFloat(selectedBody.oversizing) > 25) {
        warningHTML += `
            <div class="warning">
                <strong>Advertencia:</strong> Sobredimensionamiento alto del cuerpo principal (+${selectedBody.oversizing}%). Verificar compatibilidad anatómica.
            </div>
        `;
    }
    
    if (parseFloat(selectedBody.oversizing) < 10) {
        warningHTML += `
            <div class="warning">
                <strong>Advertencia:</strong> Sobredimensionamiento muy bajo del cuerpo principal (+${selectedBody.oversizing}%). Riesgo elevado de endoleak tipo I.
            </div>
        `;
    }

    resultsHTML += warningHTML;

    resultsDiv.innerHTML = resultsHTML;
}

// Permitir cálculo con Enter
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        calculateProsthesis();
    }
});