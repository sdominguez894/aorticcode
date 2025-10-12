import { BranchesRepoStatic } from '/static/infrastructure/respositories/BranchesRepoStatic.js';

/**
 * Outbound port for fetching prosthesis branches.
 * @interface
 */
export class BranchesRepository
{
    constructor(){}

    /**
     * @returns {Promise<import('../entities/Branch.js').Branch[]>}
     */
    async getAll()
    {
        return new BranchesRepoStatic().getAll();
    }
}
