/**
 * Immutable value object representing a patient's anatomical measurements
 * relevant to prosthesis fitting.
 */
export class PatientMeasurements
{
    /**
     * @param {Object} params
     * @param {number} params.neckDiameter - Neck diameter (mm).
     * @param {number} params.contralateralIliacDiameter - Contralateral iliac diameter (mm).
     * @param {number} params.ipsilateralIliacDiameter - Ipsilateral iliac diameter (mm).
     * @param {number} params.contralateralDistance - Contralateral distance (mm).
     * @param {number} params.ipsilateralDistance - Ipsilateral distance (mm).
     */
    constructor({
        neckDiameter,
        contralateralIliacDiameter,
        ipsilateralIliacDiameter,
        contralateralDistance,
        ipsilateralDistance
    })
    {
        this.neckDiameter = neckDiameter;
        this.contralateralIliacDiameter = contralateralIliacDiameter;
        this.ipsilateralIliacDiameter = ipsilateralIliacDiameter;
        this.contralateralDistance = contralateralDistance;
        this.ipsilateralDistance = ipsilateralDistance;

        this.validate();
        Object.freeze(this);
    }

    /**
     * Validates that all values are positive numbers.
     * @throws {Error} If any measurement is invalid.
     */
    validate()
    {
        for (const [key, value] of Object.entries(this))
        {
            if (!Number.isFinite(value) || value <= 0)
            {
                throw new Error(`Invalid value for ${key}: must be a positive number.`);
            }
        }
    }
}
