pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/comparators.circom";

template CheckNotGreaterThanZero() {
    signal input x; // Input integer to check

    // Check if x is greater than 0
    component gtZero = GreaterThan(252);
    gtZero.in[0] <== x;   // Compare x against 0
    gtZero.in[1] <== 0;   // Zero is the second input

    // Invert the result so that it returns true if x <= 0
    signal output result;
    result <== 1 - gtZero.out; // Result is 1 if x <= 0, otherwise 0
}

component main {public [x]} = CheckNotGreaterThanZero();
