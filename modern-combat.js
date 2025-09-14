/***********************************************************************
Copyright (c) 2025 magicshortbow
Licensed under the MIT License (see https://opensource.org/license/MIT)
***********************************************************************/

/* 
Modern Combat Script by magicshortbow

Spices up modern combat by prompting the LLM to act in certain ways
when faced with explosives, projectiles, or melee based on their attributes.

This requires a simple attribute injection script that is executed before this script.

Basically, make a script with the following contents, you can name it "Bob's Attributes" or something like that:

const attributes = { // change these around based on your character's personality
  vitality: 50,
  agility: 50,
  resilience: 50,
  strength: 50,
  perception: 50,
  stress_control: 50,
  handling: 50,
  cqc: 50,
  melee: 50
}

context.character.attributes = attributes

*/

/* 
Note: These are the attributes
physical
  - vitality
  - agility
  - resilience
  - strength
mental
  - perception
  - stress_control
combat
  - handling
  - cqc
  - melee
*/

const DEBUG = 1
const attributes = context.character.attributes // setup using the attribute injection script prior to this script
if (DEBUG) console.log(attributes)

// assigning as consts to reduce typo chance
const UNPHASED = "unphased"
const FLINCH = "flinch"
const CONCUSSED = "concussed"
const INCAPACITATED = "incapacitated"
const CLOSE = "close"
const MEDIUM = "medium"
const LONG = "long"
const UNHARMED = "unharmed"
const WOUNDED = "wounded"
const KILLED = "killed"
const SUPPRESSED = "suppressed"
const SHOCKED = "shocked"
const LIGHT = "light"
const SEVERE = "severe"
const MORTAL = "mortal"
const EFFECTIVELY = "effectively"
const INEFFECTIVELY = "ineffectively"
const NUMBED = "numbed by adrenaline"

/*
* Name: roll_outcome
* Description: Determines the outcome given the threshold and two to three choices
* Parameters:
*   - favorable_threshold: number, the threshold for a favorable outcome
*   - favorable: string, favorable outcome
*   - middle: string, middling outcome
*   - worst: string (optional), worst outcome
* Returns:
*   - string, one of the given outcomes
*/
function roll_outcome(favorable_threshold, favorable, middle, worst)
{
  const roll = Math.random() * 100
  if (worst)
  {
    if (roll > favorable_threshold)
    {
      // 20% chance off of the difference for something bad to happen
      const worst_threshold = 80 + (0.2 * favorable_threshold)
      return (roll < worst_threshold) ? middle : worst
    }
    return favorable
  }
  else
  {
    return (roll < favorable_threshold) ? favorable : middle
  }
}

/*
* Name: get_prefix
* Description: Returns the prefix based on the given distance.
* Parameters:
*   - distance: string, either close, medium, or long
* Returns:
*   - string, ["close", "medium", "long"] range
*/
function get_prefix(distance)
{
  if (distance === CLOSE)
  {
    return "- Close range: "
  }
  else if (distance === MEDIUM)
  {
    return "- Medium range: "
  }
  else
  {
    return "- Long range: "
  }
}

/*
* Name: determine_shrapnel_effect
* Description: Determines the presence of shrapnel.
* Parameters:
*   - distance: string, either "close" or "medium" distance
* Returns:
*   - string, either "is not" or "is"
*/
function determine_shrapnel_effect(distance)
{
  const roll = Math.random()
  if (distance === CLOSE)
  {
    // sorry dawg, you're cooked
    return (roll < 0.3) ? "is not" : "is"
  }
  else if (distance === MEDIUM)
  {
    // gotta be pretty unlucky 
    return (roll < 0.75) ? "is not" : "is"
  }
}

/*
* Name: build_out_explosive_reaction
* Description: Builds out the explosive reaction for the given distance
* Parameters:
*   - distance: string, either close, medium, or long 
* Returns:
*   - string, a built out reaction
*/
function build_out_explosive_reaction(distance)
{
  let reaction = get_prefix(distance)
  let blast_res = ""
  let shrapnel_res = ""
  const threshold = ((attributes.resilience*0.7) + (attributes.stress_control*0.3))
  
  if (distance === CLOSE)
  {
    blast_res = roll_outcome(threshold, FLINCH, CONCUSSED, INCAPACITATED)
    shrapnel_res = determine_shrapnel_effect(CLOSE)
  }
  else if (distance === MEDIUM)
  {
    blast_res = roll_outcome(threshold, UNPHASED, FLINCH, CONCUSSED)
    shrapnel_res = determine_shrapnel_effect(MEDIUM)
  }
  else
  {
    blast_res = roll_outcome(threshold, UNPHASED, FLINCH)
  }

  reaction += `${blast_res} from the blast`

  if (distance === LONG)
  {
    reaction += ".\n"
    return reaction
  }

  reaction += `, and shrapnel (projectile) ${shrapnel_res} directed at them.\n`
  return reaction
}

/*
* Name: determine_projectile_hit
* Description: Determines the outcome of a projectile for the given distance
* Parameters:
*   - distance: string, either close, medium, or long 
* Returns:
*   - string, unharmed, wounded, or killed
*/
function determine_projectile_hit(distance)
{
  let threshold = 0
  if (distance === CLOSE)
  {
    threshold = ((attributes.agility * 0.4) + (attributes.perception * 0.2) + (attributes.cqc * 0.4))
  }
  else if (distance === MEDIUM)
  {
    threshold = ((attributes.agility * 0.5) + (attributes.perception * 0.5))
  }
  else
  {
    threshold = ((attributes.agility * 0.7) + (attributes.perception * 0.3))
  }
  return roll_outcome(threshold, UNHARMED, WOUNDED, KILLED)
}

/*
* Name: determine_mental_effect
* Description: Determines the outcome of {{char}}'s mental for the given distance
* Parameters:
*   - distance: string, either close, medium, or long 
* Returns:
*   - string, unphased, suppressed, or shocked (if wounded)
*/
function determine_mental_effect(distance, is_wounded)
{
  let threshold = 0
  if (distance === CLOSE)
  {
    threshold = ((attributes.perception * 0.1) + (attributes.stress_control * 0.4) + (attributes.cqc * 0.5))
  }
  else if (distance === MEDIUM)
  {
    threshold = ((attributes.perception * 0.3) + (attributes.stress_control * 0.7))
  }
  else
  {
    threshold = ((attributes.perception * 0.1) + (attributes.stress_control * 0.9))
  }
  
  if (is_wounded)
  {
    return roll_outcome(threshold, NUMBED, SUPPRESSED, SHOCKED)
  }
  else
  {
    return roll_outcome(threshold, UNPHASED, SUPPRESSED)
  }
}

/*
* Name: determine_wound_severity
* Description: Determines the wound severity for the given distance
* Parameters:
*   - distance: string, either close, medium, or long 
* Returns:
*   - string, light, severe, or mortal
*/
function determine_wound_severity(distance)
{
  let threshold = 0
  if (distance === CLOSE)
  {
    threshold = ((attributes.vitality * 0.3) + (attributes.resilience * 0.4) + (attributes.cqc * 0.3))
  }
  else if (distance === MEDIUM)
  {
    threshold = ((attributes.vitality * 0.5) + (attributes.resilience * 0.5))
  }
  else
  {
    threshold = ((attributes.vitality * 0.3) + (attributes.resilience * 0.7))
  }
  return roll_outcome(threshold, LIGHT, SEVERE, MORTAL)
}

/*
* Name: determine_retaliation_effectiveness
* Description: Determines {{char}}'s ability to retaliate for the given distance
* Parameters:
*   - distance: string, either close, medium, or long 
* Returns:
*   - string, effective or ineffectively
*/
function determine_retaliation_effectiveness(distance)
{
  let threshold = 0
  if (distance === CLOSE)
  {
    threshold = ((attributes.perception * 0.1) + (attributes.handling * 0.4) + (attributes.cqc * 0.5))
  }
  else if (distance === MEDIUM)
  {
    threshold = ((attributes.perception * 0.3) + (attributes.handling * 0.7))
  }
  else
  {
    threshold = ((attributes.perception * 0.5) + (attributes.handling * 0.5))
  }
  return roll_outcome(threshold, EFFECTIVELY, INEFFECTIVELY)
}

/*
* Name: build_out_projectile_reaction
* Description: Builds out the projectile reaction for the given distance
* Parameters:
*   - distance: string, either close, medium, or long 
* Returns:
*   - string, a built out reaction
*/
function build_out_projectile_reaction(distance)
{
  let reaction = get_prefix(distance)
  let is_wounded = false
  const hit_res = determine_projectile_hit(distance)
  reaction += `Will be ${hit_res} by the projectile.`
  if (hit_res === KILLED)
  {
    reaction += "\n"
    return reaction
  }
  else if (hit_res === WOUNDED)
  {
    is_wounded = true
    reaction += ` The wound is ${determine_wound_severity(distance)}.`
  }

  reaction += ` {{char}} will be ${determine_mental_effect(distance, is_wounded)}.`
  reaction += ` If it makes sense to return fire, they will do so ${determine_retaliation_effectiveness(distance)}.`
  
  reaction += "\n"
  return reaction
}

// Explosives
context.character.scenario += "# {{char}} should react to an explosion in this way:\n"
context.character.scenario += build_out_explosive_reaction(CLOSE)
context.character.scenario += build_out_explosive_reaction(MEDIUM)
context.character.scenario += build_out_explosive_reaction(LONG)

// Projectiles
context.character.scenario += "# {{char}} should react to being shot at, or a projectile directed towards them, in this way:\n"
context.character.scenario += build_out_projectile_reaction(CLOSE)
context.character.scenario += build_out_projectile_reaction(MEDIUM)
context.character.scenario += build_out_projectile_reaction(LONG)

// Melee
const melee_threshold = ((attributes.strength * 0.4) + (attributes.strength * 0.6))
context.character.scenario += `# In melee combat, {{char}} should fight ${roll_outcome(melee_threshold, EFFECTIVELY, INEFFECTIVELY)}.\n`



















