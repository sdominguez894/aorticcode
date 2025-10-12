import { Body } from '/static/domain/entities/Body.js';

/**
 * Repositorio estático para obtener los cuerpos de prótesis.
 * Implementa un patrón singleton para cachear los datos una vez cargados.
 */
export class BodiesRepoStatic
{
  // Shared by all instances
  static _cache = null;
  static BODIES_URL = '/static/infrastructure/data/bodies.js';

  async getAll()
  {
    if ( !BodiesRepoStatic._cache )
    {
      // Lazy-load the bodies data only when not cached
      const bodiesModule = await import( BodiesRepoStatic.BODIES_URL );
      
      // Obtenim les branques del mòdul carregat i generem objectes Branch que guardem a la cache
      BodiesRepoStatic._cache = bodiesModule.bodies
                                            .map( bodyData => new Body(bodyData) );
    }
    
    return BodiesRepoStatic._cache;
  }
}
