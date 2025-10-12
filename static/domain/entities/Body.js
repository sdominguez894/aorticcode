/**
 * Represents a prosthesis body component.
 */
export class Body
{
    /**
     * @param {string} params.code - Unique identifier or reference code.
     * @param {number} params.diameter - Diameter of the body.
     * @param {number} params.length - Total length of the body.
     * @param {number} params.shortLeg - Length of the short leg.
     * @param {number} params.longLeg - Length of the long leg.
     */
    constructor({ code, diameter, length, shortLeg, longLeg }) 
    {
        /** @type {string} Unique code identifying the body model. */
        this.code = code;

        /** @type {number} Diameter of the prosthesis body. */
        this.diameter = diameter;

        /** @type {number} Total length of the body. */
        this.length = length;

        /** @type {number} Length of the short leg section. */
        this.shortLeg = shortLeg;

        /** @type {number} Length of the long leg section. */
        this.longLeg = longLeg;
    }

    /**
     * Validates the integrity of the body’s dimensions.
     * @throws {Error} If any dimension is invalid.
     */
    validate()
    {
        if( !this.code )
        {
            throw new Error('Body code is required.');
        }

        if( this.diameter <= 0 )
        {
            throw new Error('Diameter must be positive.');
        }

        if( this.length <= 0 )
        {
            throw new Error('Length must be positive.');
        }

        if( this.shortLeg < 0 || this.longLeg < 0 )
        {
            throw new Error('Leg lengths must be non-negative.');
        }
    }
}
