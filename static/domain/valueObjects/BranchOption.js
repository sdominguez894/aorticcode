import { BranchSide } from '/static/domain/enums/BranchSide.js';
import { BranchType } from '/static/domain/enums/BranchType.js';

/**
 * Value Object representing a possible iliac branch prosthetic option
 * calculated based on the anatomical measurements of a patient
 * 
 * Immutable: once created, its properties should not be mutated.
 */
export class BranchOption
{
  /**
   * @param {Object} params
   * @param {BranchSide} params.side - Side of branch, see BranchSide 
   * @param {BranchType} params.type - Type of branch, see BranchType
   * @param {Branch[]} params.branches - The branches involved in this option.
   * @param {number} params.totalCoverage - Total coverage length (mm).
   * @param {number} params.excess - Excess coverage beyond anatomical distance (mm).
   * @param {string|number} params.oversizing - Oversizing percentage.
   */
  constructor({ type, branches, totalCoverage, excess, oversizing }) {
    this._type = type;
    this._branches = Object.freeze(branches.slice()); // immutable copy
    this._totalCoverage = totalCoverage;
    this._excess = excess;
    this._oversizing = oversizing;

    Object.freeze(this); // make the whole object immutable
  }

  /** @returns {BranchSide} */
  get side() { return this._side; }

  /** @returns {BranchType} */
  get type() { return this._type; }

  /** @returns {Branch[]} */
  get branches() { return this._branches; }

  /** @returns {number} */
  get totalCoverage() { return this._totalCoverage; }

  /** @returns {number} */
  get excess() { return this._excess; }

  /** @returns {string|number} */
  get oversizing() { return this._oversizing; }

  /**
   * Creates a textual summary for display or debugging.
   */
  toString()
  {
    const names = this._branches.map(b => b.code ?? b.id ?? 'unknown')
                                .join(' + ');

    return `${this._side.toUpperCase()} - ${this._type.toUpperCase()} [${names}] — ${this._oversizing}% oversizing, +${this._excess}mm`;
  }
}
