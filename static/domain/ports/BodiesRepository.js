import { BodiesRepoStatic } from '/static/infrastructure/respositories/BodiesRepoStatic.js';

/**
 * Outbound port for fetching prosthesis bodies.
 * @interface
 */
export class BodiesRepository
{
    constructor(){}

    async getAll()
    {
        return new BodiesRepoStatic().getAll();
    }
}
