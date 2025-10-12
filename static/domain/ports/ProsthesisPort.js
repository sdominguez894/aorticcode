import { BodiesRepository } from "/static/domain/ports/BodiesRepository.js";
import { BranchesRepository } from "/static/domain/ports/BranchesRepository.js";
import { PatientMeasurements } from "/static/domain/entities/PatientMeasurements.js";
import { ProsthesisService } from "/static/domain/services/ProsthesisService.js";

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
export class ProsthesisPort
{
   /**
     * Inicialitza les dades estàtiques necessàries per a la selecció de pròtesis.
     * Aquesta funció ha de ser cridada abans d'utilitzar altres mètodes del servei.
     *
     * @returns {Promise<ProsthesisService>} Retorna la mateixa instància per permetre encadenament.
     */
    async init() 
    {
        // Carrega les dades estàtiques necessàries al servei
        await this.prosthesisService.init();

        // Retorna l'objecte del port
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
        this.prosthesisService = new ProsthesisService({ bodiesRepo, branchesRepo, measurements });
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
        return this.prosthesisService.selectMainBody(neckDiameter);
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
        return this.prosthesisService.findBranchOptions(targetIliacDiameter, bodyLength, legLength, totalAnatomicalDistance);
    }
}
