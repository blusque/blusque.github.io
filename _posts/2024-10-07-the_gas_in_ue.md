---
title: 'The GAS in UE'
date: 2024-09-29
permalink: /posts/2024/09/blog-post-1/
tags:
  - Motion Matching
  - Game Development
  - Unreal Engine
---
![Motion Matching](../images/mm_ue/cover.png)

This blog records the game development of Aura - a tutorial game project made on GAS(Game Abilities System), following the Udemy course *[Aura - Top Down RPG](https://www.udemy.com/course/unreal-engine-5-gas-top-down-rpg/?couponCode=KEEPLEARNING)*. Although I will briefly show other trivial things like how to setup a project or how to make a character blueprint as the lecture goes, it's mainly about GAS and how to implement it in C++. Good luck!

Aura -- Tutorial on GAS
=======================

UE 5.4 has been released for nearly three months (actually I forgot how long since it was released, let's suppose it is 3 months), and the most blockbuster update would be the **Official Motion Matching**. In this year, the most sold game BlackMyth: Wukong claimed that they used Motion Matching to reduce the workloads of character animation and enhance the reality in their game, while they didn't use the official one. Actually, they bought a plugin from the UE market at first and spent some times to modify it so that the plugin can meet their needs, and I think it's quite tough work and UE does save us a lot of times. By the way, as for motion matching, I also implement it by myself in python for my homework, and I record it in another blog, thanks for Daniel's blog [The Orange Duck](https://www.theorangeduck.com/).

GAS
===

GAS is a plugin in Unreal Engine since 5.2.

Initialize the Game
===================

Create a New Game Project
-------------------------

OK, let's first talk about the motiong matching. Motion Matching [Clavet 2016] is one of the most significant and revolutional technology in character animation and game industry. I don't want to spend too much time on the theoretical things, because there have been too many blogs and papars trying to explain how motion matching works in detail, and I also wrote about that in another blog about implementing motion matching in python. Generally speaking, instead of using the handcrafted animation to motivate characters, motion matching directly searches for the most plausible pose in a mocap database to generate the next motion.

I want to talk about something more general, something like the advantages and limitations of motion matching.

Create the Character Classes
----------------------------

Game Ability System
===================

Why we need a separated Player State?
-------------------------------------

GAS in Multiplayer
------------------

* Multiplayer games
  * Server is the Authority

    Multiplayer means multiple computer. We have to decide which one is in charge if some differences happen, and actually they always happen because of the network lag. Since the latency may be too large somtimes, it may lead to some disasters, like that one player may die from your damage in your version of game while he/she also killed you on his computer. That's terrible. So we have to choose one 'correct' computer and let it do all 'important' work, like changing health, applying damages. In most cases, we choose the server as the chief.
  * What is on the Server?
  * What is on Clients?
  * How to modify attributes?
