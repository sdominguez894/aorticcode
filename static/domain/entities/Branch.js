/**
 * Represents a prosthesis branch component.
 */
export class Branch 
{
    /**
     * @param {Object} params - The branch parameters 
     * @param {string} params.code - Unique identifier or reference code.
     * @param {number} params.diameter - Diameter of the branch.
     * @param {number} params.length - Total length of the branch.
     */
    constructor({ code, diameter, length }) 
    {
        this.code = code;
        this.diameter = diameter;
        this.length = length;
    }

    /**
     * Validates the integrity of the branch’s dimensions.
     * @throws {Error} If any dimension is invalid.
     */
    validate()
    {
        if( !this.code )
        {
            throw new Error('Branch code is required.');
        }

        if( this.diameter <= 0 )
        {
            throw new Error('Diameter must be positive.');
        }

        if( this.length <= 0 )
        {
            throw new Error('Length must be positive.');
        }
    }
}
