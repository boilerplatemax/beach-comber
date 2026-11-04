# Tri Soup creature config & animation reference

Nov 3, 2026 · @Max

Tri Soup exports each creature as a .glb model plus a \<id\>.creature.js config. One shared creature-runtime.js (three.js r160) reads any config and plays 22 animations across four methods: shader, skeletal, clip and bird. Read this guide to pick states for a creature, edit its config, and drive it from game code. Every name below matches the exporter and runtime exactly.

## Config file

A config is a plain JS object exported as \<id\>Config. The runtime only requires id and model. Everything else is written by the exporter, and you can edit any of it by hand.

| Field            | Type                                                   | Meaning                                                                                                                                                                                                                                                                                                                                                        |
|------------------|--------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| id               | string                                                 | Name used in register, load and spawn.                                                                                                                                                                                                                                                                                                                         |
| model            | string, function or object                             | A .glb path relative to the page. It can also be a function returning one, or inline { pos, col } triangle data.                                                                                                                                                                                                                                               |
| method           | 'shader' \| 'skeletal' \| 'clip' \| 'bird' \| 'static' | Method of the default animation ('static' when there is none). Informational only.                                                                                                                                                                                                                                                                             |
| type             | string                                                 | 'quadruped' for rigged animals, 'bird' for birds, otherwise the default shader type. Informational only.                                                                                                                                                                                                                                                       |
| rig              | 'quadruped' \| null                                    | Set when the model has a four-legged skeleton.                                                                                                                                                                                                                                                                                                                 |
| defaultAnimation | state name \| null                                     | The state spawn() starts in when no animation option is given.                                                                                                                                                                                                                                                                                                 |
| states           | string\[\]                                             | Names of every entry in animations.                                                                                                                                                                                                                                                                                                                            |
| animations       | { \[stateName\]: state }                               | The playable states. Keys are your names; each state's type picks the built-in motion. See Per-state settings.                                                                                                                                                                                                                                                 |
| skeleton         | object \| null                                         | Rigged models only: source ('auto' = Tri Soup built the rig, 'file' = the model's own bones), bones as \[name, parentIndex, x, y, z\] rest positions, roles (bone indices for root, spine, neck, head, tail and legs FL/FR/BL/BR), frame (fwd/side/up axes), height and contact (ground, belly, paw, head reach etc.). Generated by Tri Soup; don't hand-edit. |
| bird             | object                                                 | Birds only. ground and air each give { model, frame } (one .glb per pose). align: { yaw, offset } places the flight model in the ground model's space. fwd is the direction to move it.                                                                                                                                                                        |
| size             | \[x, y, z\]                                            | Bounding box of the model in model units. Useful for scaling and spacing.                                                                                                                                                                                                                                                                                      |

Which states an export contains:

- Skeletal animals get every skeletal state the rig supports. Rest is left out if the model can't lie down cleanly.

- Shader states are only the ones you tried in Tri Soup, plus the selected one. Each keeps its own tuned speed and intensity.

- Models with their own animation clips also get one clip state per clip.

- Birds always get all six bird states.

## The four methods

A state's method decides how it moves the model. A creature can mix methods: a rigged wolf can carry skeletal states, its own clips, and a shader state such as sway side by side.

| Method   | How it moves                                                                                                                                                  | What the model needs                                                                                                                                       | Animation types                                                                   |
|----------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------|
| shader   | Bends the vertices in the vertex shader around an automatically measured body frame.                                                                          | Any mesh. Crawl also needs per-vertex leg data, stored in the exported .glb as \_TSLEG and \_TSLEGREACH.                                                   | swim, undulate, pulse, sway, crawl, slither                                       |
| skeletal | Procedural poses computed every frame on a four-legged skeleton: gaits, IK feet, head reach.                                                                  | A quadruped rig (rig: 'quadruped'), either auto-built by Tri Soup or the file's own bones.                                                                 | idle, walk, run, pounce, bound, eat, drink, look, rest, die                       |
| clip     | Plays an animation clip that came inside the original model, through three.js AnimationMixer.                                                                 | The file's own skeleton and clips (skeleton.source: 'file').                                                                                               | Whatever the file contains, e.g. Gallop, Attack. The state's clip field names it. |
| bird     | Shader deformation of wings, legs, body and head from the per-vertex mask \_TSBIRD. Two models, ground and flight, cross-dissolve during takeoff and landing. | A bird block. Two exported .glbs: ground (wings folded) and air (wings spread). A single model also exports, but it has no swap. That case is less tested. | bird-idle, bird-walk, bird-takeoff, bird-flap, bird-glide, bird-landing           |

## Every animation

The tables list each built-in type with three things:

- **Rate:** cycles per second at speed: 1.

- **Transition:** the default blend times the exporter writes, in seconds.

- **Travel:** what the game must do to move the creature. Moving states animate in place.

### Shader types (any mesh)

| type                 | For                                   | What it does                                                                                                     | Rate | Transition | Travel                                                         |
|----------------------|---------------------------------------|------------------------------------------------------------------------------------------------------------------|------|------------|----------------------------------------------------------------|
| swim                 | Fish, sharks                          | A wave runs from head to tail; the head stays almost still.                                                      | 1.0  | 0.5        | Move it yourself at any speed.                                 |
| undulate             | Snakes, eels, worms (in water or air) | Waves travel along the whole body.                                                                               | 0.7  | 0.5        | Move it yourself.                                              |
| pulse                | Jellyfish, slimes                     | Squeezes in and stretches up, starting at the top.                                                               | 0.5  | 0.5        | None.                                                          |
| sway                 | Plants, idle creatures                | Leans gently side to side from the base; higher parts lean further and later.                                    | 0.35 | 0.5        | None.                                                          |
| crawl (experimental) | Crabs, spiders, insects               | Legs step in alternating sets while the body bobs. Claws, if found, are held up. It walks forward or sideways.   | 1.1  | 0.5        | Move along body.legs.dir at groundSpeed.                       |
| slither              | Snakes on the ground                  | S-bends travel down the body, which slides forward with the head leading; it always bends flat along the ground. | 0.6  | 0.5        | Move along body.fwd at groundSpeed (one wavelength per cycle). |

### Skeletal types (quadruped rig)

| type   | What it does                                                                                                                                         | Rate  | Transition in / out       | Loop                           | Travel                                                                |
|--------|------------------------------------------------------------------------------------------------------------------------------------------------------|-------|---------------------------|--------------------------------|-----------------------------------------------------------------------|
| idle   | Breathing, small weight shifts, a slow look around.                                                                                                  | 0.25  | 0.4 / –                   | yes                            | None.                                                                 |
| walk   | Four-beat walk: back left, front left, back right, front right.                                                                                      | 0.9   | 0.35 / –                  | yes                            | Forward at groundSpeed.                                               |
| run    | Bounding gallop: the back legs push together, then the front legs.                                                                                   | 1.7   | 0.3 / –                   | yes                            | Forward at groundSpeed.                                               |
| pounce | Predator attack: crouches, springs off the back legs with the front legs reaching, lands front feet first, stands back up. Starts and ends standing. | 0.45  | 0.3 / 0.3                 | set loop: false for one pounce | Forward at groundSpeed, which is fast in the air and 0 on the ground. |
| bound  | Prey stotting: high springy jumps on stiff legs, all four feet together, head and tail up.                                                           | 1.25  | 0.25 / –                  | yes                            | Forward at groundSpeed (steady).                                      |
| eat    | Head down to the ground, chewing and tugging, looking up now and then. Front legs bend if the neck can't reach.                                      | 0.125 | 0.9 / 0.6                 | yes                            | None.                                                                 |
| drink  | Head down to water, lapping in bursts with pauses.                                                                                                   | 0.167 | 1.0 / 0.8                 | yes                            | None.                                                                 |
| look   | Slow head and neck turns with pauses; the body stays still.                                                                                          | 0.1   | 0.6 / 0.5                 | yes                            | None.                                                                 |
| rest   | Lies down back end first and breathes slowly. Leaving it makes it get up, front end first.                                                           | 0.25  | 2.0 lie down / 1.6 get up | yes                            | None (groundSpeed is 0 while getting up).                             |
| die    | Stumbles, legs buckle, collapses onto its side and stays down.                                                                                       | 0.5   | 0.2 / 1.0                 | no (holds the final pose)      | None.                                                                 |

### Bird types (bird config)

In a bird config, the state names drop the bird- prefix: idle, walk, takeoff, flap, glide, landing. Each state's type keeps the prefix.

| State (type)           | Model shown      | What it does                                                                                            | Rate | Transition | Then            | Travel                                                                                                       |
|------------------------|------------------|---------------------------------------------------------------------------------------------------------|------|------------|-----------------|--------------------------------------------------------------------------------------------------------------|
| idle (bird-idle)       | Ground           | Breathing and slow looks; use it standing or perched.                                                   | 0.18 | 0.35       | loops           | None.                                                                                                        |
| walk (bird-walk)       | Ground           | Legs step in turn, body waddles, head bobs.                                                             | 1.1  | 0.35       | loops           | Along bird.fwd at groundSpeed.                                                                               |
| takeoff (bird-takeoff) | Ground, then air | Crouches and leaps, dissolves into the flight model at the top, beats the wings open.                   | 0.8  | 0.35       | goes on to flap | Up at climb, forward at groundSpeed.                                                                         |
| flap (bird-flap)       | Air              | Wingbeats; the body rises a little on each downstroke.                                                  | 2.4  | 0.3        | loops           | Forward at groundSpeed.                                                                                      |
| glide (bird-glide)     | Air              | Wings held out nearly flat while it banks gently.                                                       | 0.2  | 0.6        | loops           | Forward at groundSpeed.                                                                                      |
| landing (bird-landing) | Air, then ground | Flares (body up, quick beats), dissolves into the ground model at touchdown as the wings fold, settles. | 0.7  | 0.35       | goes on to idle | Down at climb (negative), forward at groundSpeed. Start it about 0.8 × bird.air.frame.unit above the ground. |

### Clip states

A clip state looks like { method: 'clip', clip: 'Gallop', speed: 1, loop: true, transition: 0.3 }. The exporter writes loop: true for every clip, including one-shots such as Death. Set loop: false on those yourself. Clips don't report groundSpeed.

## Per-state settings

Each entry in animations is one state. The fields below are the ones the runtime reads; any other field is ignored.

| Field         | Applies to             | Meaning                                                                                                                                                                                                                                                                                        |
|---------------|------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| method        | all                    | 'shader', 'skeletal', 'clip' or 'bird'.                                                                                                                                                                                                                                                        |
| type          | shader, skeletal, bird | The built-in motion, from Every animation.                                                                                                                                                                                                                                                     |
| clip          | clip                   | Name of the clip inside the .glb.                                                                                                                                                                                                                                                              |
| speed         | all                    | Playback rate multiplier. 1 plays at the rate in the tables, and groundSpeed scales with it.                                                                                                                                                                                                   |
| intensity     | shader, skeletal, bird | Amplitude multiplier: how big the bends, strides, jumps or wingbeats are. 0 is still and 1 is the tuned default. It also changes groundSpeed for gaits, crawl and birds.                                                                                                                       |
| loop          | all                    | false plays once, then the state is finished and onFinish fires. die ignores it and holds its last pose. Bird takeoff/landing always go on to flap/idle.                                                                                                                                       |
| transition    | all                    | Seconds to blend into this state. For rest, it is how long lying down takes.                                                                                                                                                                                                                   |
| transitionOut | optional               | Seconds to blend out of this state. A switch takes the larger of the old state's transitionOut and the new state's transition. For rest, it is how long getting up takes.                                                                                                                      |
| body          | shader                 | The body frame the shader bends around. Measured from the mesh: center, unit axes fwd (toward the head), side and up, and half (half-size along fwd, side, up). Leave it as exported.                                                                                                          |
| body.legs     | crawl only             | move: \[stride, lift, bodyBob, bodySurge\] in model units. Stride is how far the tips swing; lift is how high they rise. Bigger values mean bigger steps, and groundSpeed follows stride. dir is the unit direction it walks: equal to fwd for forward walkers and to side for sideways crabs. |

The defaults are speed 1, intensity 1, loop true and the type's own transition. Any of them can be left out.

### Adding your own variants

State names are yours, and several states can share one type with different settings. Copy an existing entry and change the numbers:

animations: {  
walk: { method: 'skeletal', type: 'walk', speed: 1, intensity: 1, loop: true, transition: 0.35 },  
sneak: { method: 'skeletal', type: 'walk', speed: 0.6, intensity: 0.5, transition: 0.5 },  
attack: { method: 'skeletal', type: 'pounce', speed: 1.2, loop: false, transition: 0.2 },  
// a shader variant must copy the body block of a state with the same type  
scuttle: { ...crabConfig.animations.crawl, speed: 2.2, intensity: 0.6 },  
},  
states: \['walk', 'sneak', 'attack', 'scuttle'\],

A skeletal state works on any rigged quadruped, even one exported without it, because the rig is in skeleton. A shader state needs a body measured for that model, so add the type in Tri Soup and re-export rather than inventing one. Crawl must come from the exported .glb.

## Runtime API

Install creature-runtime.js once. Register each config, await load(id) once (instances share the geometry), then spawn as many instances as you like. Call update(dt) every frame.

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';  
import { createCreatureRuntime } from './creature-runtime.js';  
import { wolfConfig } from './wolf.creature.js';  
  
const creatures = createCreatureRuntime(THREE, { loader: new GLTFLoader() });  
creatures.register(wolfConfig);  
await creatures.load('wolf');  
const wolf = creatures.spawn('wolf', { animation: 'walk', phase: Math.random() });  
scene.add(wolf.object);  
  
function frame(dt) {  
creatures.update(dt);  
// moving states play in place: push the object at groundSpeed so the feet don't slide  
wolf.object.position.addScaledVector(forward, wolf.groundSpeed \* dt);  
}  
  
wolf.setState('run'); // blend using the config's transition times  
wolf.setState('idle', { duration: 1.2 }); // your own blend time  
wolf.play('look'); // switch at once  
wolf.setState('die', { fallDirection: 'left', fallSpeed: 1, variation: 42 });

### createCreatureRuntime(THREE, options)

| Option     | Meaning                                                                                                                                                                                                            |
|------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| loader     | A GLTFLoader. Needed when a model is a .glb path.                                                                                                                                                                  |
| material   | (THREE, config) =\> material. Your own material, e.g. MeshLambertMaterial({ vertexColors: true, flatShading: true }). The animation code is injected into it, so lit, fogged or custom materials animate the same. |
| srgbOutput | Colour output for the default material only.                                                                                                                                                                       |

It returns register(config), load(id) (a promise), spawn(id, opts), update(dt) and unload(id) (dispose that creature's instances first). It also has instances and configs.

### spawn(id, opts)

| Option    | Meaning                                                                                              |
|-----------|------------------------------------------------------------------------------------------------------|
| animation | Starting state. Defaults to defaultAnimation.                                                        |
| speed     | Instance speed multiplier, on top of each state's speed.                                             |
| intensity | Instance intensity multiplier, on top of each state's intensity.                                     |
| phase     | Starting point in the cycle, 0 to 1. Randomise it so a herd doesn't move in lockstep.                |
| paused    | Start paused.                                                                                        |
| seed      | Integer that fixes this instance's random variation (idle shifts and similar). Random when left out. |
| onFinish  | (instance) =\> {}, called when a non-looping state ends.                                             |

### Instance methods

| Method                        | Meaning                                                                                                                                                                                                                                                                                                                                                                    |
|-------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| setState(name, o)             | Blends to a state from wherever the pose is, even mid-transition. A resting animal gets up first. Options: duration (seconds), phase, speed, intensity, restart (replay if already in it). die also takes fallDirection ('left' \| 'right'), fallSpeed (rate factor) and variation (number or string; the same value gives the same fall, and it is random when left out). |
| play(name, o)                 | Switches at once. Options: blend (seconds, default 0), phase, speed, intensity, restart.                                                                                                                                                                                                                                                                                   |
| setSpeed(s) / setIntensity(v) | Change the instance multipliers.                                                                                                                                                                                                                                                                                                                                           |
| pause() / resume()            | Freeze or continue.                                                                                                                                                                                                                                                                                                                                                        |
| dispose()                     | Remove the instance from the scene and free its skeleton.                                                                                                                                                                                                                                                                                                                  |

All methods return the instance, so calls chain. An unknown state name throws an error listing the valid ones.

### Instance properties

| Property                          | Meaning                                                                                             |
|-----------------------------------|-----------------------------------------------------------------------------------------------------|
| object                            | The THREE.Group to add to the scene, move, rotate and scale.                                        |
| mesh, bones, skeleton, config, id | Internals, for attaching items to bones and similar.                                                |
| state                             | The state showing now.                                                                              |
| target                            | The state last asked for. It differs from state while getting up from rest.                         |
| phase                             | Position in the cycle, 0 to 1 (settable).                                                           |
| finished                          | true once a non-looping state has ended.                                                            |
| transitioning                     | true while blending, getting up or lying down.                                                      |
| groundSpeed                       | Units per second to move the object. It eases through transitions and is 0 when paused.             |
| climb                             | Birds only: units per second up (takeoff, positive) or down (landing, negative). It is 0 otherwise. |
| model                             | Birds only: 'ground' or 'air', the model showing now. meshes.ground and meshes.air hold both.       |

Direction of travel: quadrupeds move along skeleton.frame.fwd (usually +Z), slither along body.fwd, crawl along body.legs.dir, and birds along bird.fwd. All are in model space, so rotate with object.quaternion.

## Limits and gotchas

- **One state at a time.** Methods don't layer: a wolf can't walk and sway together. Switching between methods still blends smoothly.

- **Movement is the game's job.** Every moving state plays in place. Use groundSpeed (and climb for birds) each frame, or the feet will slide.

- **One-shots.**

  - With loop: false, most states ease in and out over their single play, then set finished and call onFinish.

  - pounce plays whole: it starts and ends standing.

  - die holds its final pose until dispose(). To revive, play('idle') or setState('idle').

- **Rest needs a model that can lie down cleanly.** The exporter leaves rest out when it can't. Don't add it back by hand.

- **Bird chaining picks a state by type.** takeoff goes on to the first state whose type is bird-flap, and landing to the first with bird-idle. Rename them freely, but keep one of each type.

- **Model must match its config.** Shader body frames, crawl leg data, bird masks and skeleton rest positions are all measured on the exported .glb. A re-exported or edited model needs a re-exported config.

- **Units are model units.** The runtime doesn't rescale anything. If you scale object, motion and groundSpeed should be multiplied by that scale.

- **Crawl is experimental.** It only moves legs it can tell apart: separate leg parts, or legs with gaps between them seen from above. It's left out of the export when no legs are found.

- **Clips export with loop: true and transition: 0.3.** Fix one-shot clips by hand.

- **Requirements.** three.js r160, and models served over http, because file:// blocks the .glb fetch.
