import { BodiesRepository } from "/static/domain/ports/BodiesRepository.js";
import { BranchesRepository } from "/static/domain/ports/BranchesRepository.js";
import { BranchOption } from "/static/domain/valueObjects/BranchOption.js";
import { BranchType } from "/static/domain/enums/BranchType.js";
import { PatientMeasurements } from "/static/domain/entities/PatientMeasurements.js";

/**
 * Servei d’aplicació responsable de coordinar la lògica de selecció de la pròtesi.
 *
 * Aquesta classe implementa la lògica principal de decisió del selector de pròtesis:
 * - Seleccionar el cos principal (secció aòrtica) segons el diàmetre del coll.
 * - Trobar branques ilíaques compatibles segons distàncies i diàmetres.
 *
 * Delegarà tot l’accés a dades als ports de repositori (bodiesRepo, branchesRepo)
 * i obtindrà les mesures anatòmiques del pacient a través del port PatientMeasurementsProvider.
 */
export class ProsthesisService
{
    // Solapament mínim entre components (en mil·límetres)
    static MINIMUM_OVERLAP_MM = 30;

    /**
     * Inicialitza les dades estàtiques necessàries per a la selecció de pròtesis.
     * Aquesta funció ha de ser cridada abans d'utilitzar altres mètodes del servei.
     *
     * @returns {Promise<ProsthesisService>} Retorna la mateixa instància però amb les dades inicialitzades
     */
    async init() 
    {
        this._bodies = await this.bodiesRepo.getAll();
        this._branches = await this.branchesRepo.getAll();
        
        return this;
    }

    /**
     * Crea una nova instància de ProsthesisService.
     * 
     * ATENCIÓ: Aquesta classe depèn de la injecció de dependències amb el mètode init(), 
     * cal cridar-lo inmediatament després de crear la instància i abans d'utilitzar altres mètodes.
     * 
     * @param {Object} dependencies - Objecte amb les dependències necessàries.
     * @param {BodiesRepository} dependencies.bodiesRepo - Repositori per accedir als cossos principals.
     * @param {BranchesRepository} dependencies.branchesRepo - Repositori per accedir a les branques ilíaques.
     * @param {PatientMeasurements} dependencies.measurements - Proveïdor de mesures anatòmiques del pacient.
     */
    constructor({ bodiesRepo, branchesRepo, measurements })
    {
        // Adaptadors / ports proveïts per la capa d’infraestructura
        this.bodiesRepo = bodiesRepo;         // Proporciona els cossos principals disponibles
        this.branchesRepo = branchesRepo;     // Proporciona les branques ilíaques disponibles
        this.measurements = measurements;     // Proporciona les mesures anatòmiques del pacient (UI o font de dades)
    }

    /**
     * Selecciona el cos principal de la pròtesi més adequat per a un pacient donat.
     *
     * El cos principal ha de tenir un sobredimensionament (diferència entre el diàmetre de la pròtesi
     * i el del coll aòrtic) d’entre **10% i 30%**, que és el rang típic en planificació endovascular.
     *
     * @param {number} neckDiameter - Diàmetre del coll aòrtic del pacient (mm).
     * 
     * @returns { Body, oversizing }    El cos principal seleccionat (amb la informació de sobredimensionament) 
     *                                  o null si no hi ha cap opció vàlida.
     */
    selectMainBody( neckDiameter )
    {
        // Recupera tots els cossos disponibles del repositori
        const allBodies = this._bodies;

        // Defineix el rang de sobredimensionament acceptable (10%–30%)
        const minimumAllowedDiameter = neckDiameter * 1.10;
        const maximumAllowedDiameter = neckDiameter * 1.30;

        // Filtra els cossos que compleixen aquest rang
        const compatibleBodies = allBodies.filter(body =>
            body.diameter >= minimumAllowedDiameter && body.diameter <= maximumAllowedDiameter
        );

        // Si no hi ha cap cos compatible → retorna null (la UI ho gestionarà)
        if( compatibleBodies.length === 0 )
        {
            return null;
        }

        // Selecciona el cos compatible més petit (primer de la llista)
        const selectedBody = compatibleBodies[0];

        // Calcula el percentatge de sobredimensionament respecte al coll
        const oversizingPercent = ((selectedBody.diameter / neckDiameter - 1) * 100).toFixed(1);

        // Retorna el cos seleccionat amb la informació addicional
        return { ...selectedBody, oversizing: oversizingPercent };
    }

    /**
     * Troba les combinacions de branques ilíaques compatibles per les distàncies i diàmetres donats.
     *
     * Aquesta funció determina quines branques poden cobrir la distància requerida
     * mantenint un sobredimensionament dins del rang segur (10%–30%).
     *
     * Avalua tant combinacions d’una sola branca com de dues branques,
     * tenint en compte el solapament mínim entre components (30 mm).
     *
     * @param {number} targetIliacDiameter - Diàmetre objectiu de l’artèria ilíaca (mm).
     * @param {number} bodyLength - Longitud del cos principal seleccionat (mm).
     * @param {number} legLength - Longitud de la cama de la pròtesi (curta o llarga) (mm).
     * @param {number} totalAnatomicalDistance - Distància anatòmica total a cobrir (mm).
     * 
     * @returns { options: Array<BranchOption>,
     *            needsBridge: boolean,
     *            remainingDistance: number,
     *            compatibleBranches: Array<Branch> }
     */
    findBranchOptions(targetIliacDiameter, bodyLength, legLength, totalAnatomicalDistance)
    {
        // Obté totes les branques disponibles del repositori
        const allBranches = this._branches;

        // Rang acceptable de sobredimensionament: 10%–30% respecte al diàmetre objectiu
        const minimumAllowedDiameter = targetIliacDiameter * 1.10;
        const maximumAllowedDiameter = targetIliacDiameter * 1.30;

        // Filtra les branques compatibles per diàmetre
        const compatibleBranches = allBranches.filter( branch => branch.diameter >= minimumAllowedDiameter && 
                                                                 branch.diameter <= maximumAllowedDiameter );
        
        // Cobertura actual (cos principal + cama)
        const baseCoverage = bodyLength + legLength;

        // Distància que falta per cobrir (ajustant el solapament requerit)
        const remainingDistance = totalAnatomicalDistance - baseCoverage + ProsthesisService.MINIMUM_OVERLAP_MM;

        // Llista que contindrà totes les combinacions vàlides de branques segons les mides anatòmiques proporcionades
        const branchOptions = [];
        
        // -------------------------------------------------------------------------
        // 🩻 1️⃣ Combinacions d’una sola branca: una branca cobreix tota la distància
        // -------------------------------------------------------------------------
        for (const singleBranch of compatibleBranches)
        {
            // Cobertura total = cos + cama + branca - solapament
            const totalCoverage = baseCoverage + singleBranch.length - ProsthesisService.MINIMUM_OVERLAP_MM;

            // Si cobreix la distància anatòmica → afegeix la combinació
            if (totalCoverage >= totalAnatomicalDistance)
            {
                const oversizingPercent = ((singleBranch.diameter / targetIliacDiameter - 1) * 100).toFixed(1);

                branchOptions.push( new BranchOption({
                                                        type: BranchType.SINGLE,
                                                        branches: [singleBranch],
                                                        totalCoverage,
                                                        excess: totalCoverage - totalAnatomicalDistance,
                                                        oversizing: oversizingPercent
                                                    })
                                    );
            }
        }

        // -------------------------------------------------------------------------
        // 🧬 2️⃣ Combinacions de doble branca: dues branques per major cobertura
        // -------------------------------------------------------------------------
        for (const firstBranch of compatibleBranches)
        {
            for (const secondBranch of compatibleBranches)
            {
                // Només combinar si tenen el mateix diàmetre (compatibilitat)
                if (firstBranch.diameter !== secondBranch.diameter)
                {
                    continue;
                }

                // Cobertura total amb dues branques (dos solapaments)
                const totalCoverage = baseCoverage + firstBranch.length + secondBranch.length - ( 2 * ProsthesisService.MINIMUM_OVERLAP_MM );

                // Verifica la cobertura total i la longitud combinada
                const combinedLength = firstBranch.length + secondBranch.length - ProsthesisService.MINIMUM_OVERLAP_MM;
                const isLongEnough = combinedLength > remainingDistance;

                // Si cobreix la distància i és prou llarga → afegeix la combinació
                if (totalCoverage >= totalAnatomicalDistance && isLongEnough)
                {
                    const oversizingPercent = ((firstBranch.diameter / targetIliacDiameter - 1) * 100).toFixed(1);

                    branchOptions.push( new BranchOption({
                                                            type: BranchType.DOUBLE,
                                                            branches: [firstBranch, secondBranch],
                                                            totalCoverage,
                                                            excess: totalCoverage - totalAnatomicalDistance,
                                                            oversizing: oversizingPercent
                                                        })
                                        );
                }
            }
        }

        // -------------------------------------------------------------------------
        // 🧩 3️⃣ Determina si cal una extensió ("pont") addicional
        // -------------------------------------------------------------------------
        const longestAvailableBranchLength = Math.max( ...compatibleBranches.map(branch => branch.length), 0 );

        const requiresBridgeExtension = branchOptions.length === 0 || 
                                        remainingDistance > longestAvailableBranchLength;

        // Ordena les combinacions pel menor excés (ajust més precís primer)
        branchOptions.sort( (optionA, optionB) => optionA.excess - optionB.excess );

        // Retorna els resultats calculats a la capa de presentació
        return {
            options: branchOptions,
            needsBridge: requiresBridgeExtension,
            remainingDistance,
            compatibleBranches
        };
    }
}