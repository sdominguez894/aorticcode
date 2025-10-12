import { Branch } from '/static/domain/entities/Branch.js';

/**
 * Repositorio estático para obtener las ramas de prótesis.
 * Implementa un patrón singleton para cachear los datos una vez cargados.
 */
export class BranchesRepoStatic
{
  // Shared by all instances
  static _cache = null;
  static BRANCHES_URL = '/static/infrastructure/data/branches.js';

  /** @returns {Promise<Branch[]>} */
  async getAll()
  {
    // Si encara no està carregat → carregar i guardar a la memòria cau
    if ( !BranchesRepoStatic._cache )
    {
      const branchesModule = await import( BranchesRepoStatic.BRANCHES_URL );
     
      // Obtenim les branques del mòdul carregat i generem objectes Branch que guardem a la cache
      BranchesRepoStatic._cache = branchesModule.branches
                                                .map( branchData => new Branch(branchData) );
    }

    // Retornar el resultat de la memòria cau (ja carregat)
    return BranchesRepoStatic._cache;
  }
}