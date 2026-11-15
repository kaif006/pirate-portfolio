# Kaif - Projects

This document describes Kaif's game and graphics projects, newest first.

## Spitfin (real-time multiplayer game, October 2026)

Spitfin is a 2 to 4 player browser-based multiplayer game built with TypeScript, Three.js, Node.js, and WebSockets. Kaif directed the design and development using LLM assistance (AI-assisted development). The game runs a server-authoritative 30 Hz simulation on Node.js, WebSockets, PostgreSQL, and Redis, where clients send only their input intent.

Kaif studied and applied multiplayer netcode techniques: client-side prediction with reconciliation, snapshot interpolation, and capped lag compensation for hit detection. The game is structured around one deterministic simulation shared by the server and the client, so bugs and obstacles regenerate from a match seed instead of being sent over the network.

To review the AI-generated code, Kaif used type checking and a test suite of more than 400 tests written with Vitest. Performance practices include an allocation-free frame loop and instanced scenery drawn in a single draw call.

## Local Multiplayer Ragdoll Party Game (April 2026)

A local multiplayer party game made for a university course project in Unreal Engine 5 using C++ and Blueprints. Kaif designed the game loop architecture, handling round flow, player management, and win conditions. He implemented active ragdoll characters that react to physics while staying under player control, plus a combat system with combos and physics-based attacks.

## Tiptoe Thief (Global Game Jam Runner-Up, February 2026)

A stealth game made in Unity with C# during the 48-hour Global Game Jam by Team Untitled, which won Runner-Up. Kaif built the player controller around a dedicated sneak state (left-shift sneak) with no default running, so stealth matters more than speed. He managed Git version control and merges with teammates under time pressure to avoid conflicts. He also built a custom post-processing effect that imitates CCTV footage, giving the game a distinct visual identity. A playable build is available on itch.io.

## Harsh Dunes (3D narrative adventure, November 2025)

A 3D narrative adventure game made in Unity with C#. Kaif architected the character controller as a finite state machine (FSM), separating locomotion, combat, stealth, and aerial behavior into separate states so new mechanics can be added without changing existing ones. He built an event-driven dialogue system with a responsive UI, keeping dialogue triggers independent from gameplay code. He also integrated combat using layered animation state machines and blend trees, blending upper-body attacks with lower-body locomotion.

## Comic Fight (2.5D fighting game, October 2025)

A 2.5D fighting game made in Unity with C# and HLSL. Kaif designed a custom toon shader by combining a Sobel edge-detection shader with a cel shader. He programmed responsive fighting mechanics, including animation-triggered hitboxes and a combo system with cooldowns.

## Procedural Lizard (inverse kinematics game)

A small interactive game built in C++ with OpenGL and GLUT, featuring a lizard animated procedurally with inverse kinematics (IK).
