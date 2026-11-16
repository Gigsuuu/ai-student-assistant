/**
 * Sample Computer Engineering lecture notes for instant testing and live hackathon demos.
 * Subject: Operating Systems - Virtual Memory, Paging, and Translation Lookaside Buffers (TLB)
 */

export const SAMPLE_CE_NOTES = `Lecture 14: Virtual Memory Management & Address Translation
Course: CS/CE 301 - Modern Operating Systems & Computer Architecture
Instructor: Dept. of Computer Science and Engineering

1. Introduction to Virtual Memory
Virtual Memory is a memory management technique that provides an "idealized abstraction of the storage resources that are actually available on a given machine". It creates an illusion to the user process of a very large, contiguous address space, while physical memory (RAM) may be much smaller and non-contiguous.

Key Motivations:
- Memory Protection: Isolates processes from one another. A process cannot write or read into another process's memory space without explicit shared memory permissions.
- Swapping and Demand Paging: Programs larger than physical DRAM can run seamlessly by swapping inactive pages to secondary storage (SSD/HDD swap space).
- Memory Utilization: Physical RAM frames can be shared among processes (e.g., shared libraries like glibc/kernel space).

2. Paging and Page Tables
The CPU generates Virtual Addresses (also called Logical Addresses). The physical memory is divided into fixed-size blocks called "Frames", and the virtual address space is divided into same-sized blocks called "Pages" (typically 4 KB in modern x86-64 architectures).

Address Structure:
A virtual address consists of two components:
[ Virtual Page Number (VPN) | Page Offset ]
- For a 32-bit address space with 4 KB (2^12 bytes) pages:
  - Offset = 12 bits (selects byte within the 4 KB page)
  - VPN = 20 bits (2^20 = 1,048,576 possible pages)

Page Table Entry (PTE) Flags:
- Present/Valid Bit: Indicates if the page resides in physical RAM (1) or on disk swap (0).
- Dirty Bit (Modified Bit): Set when a write occurs. Dictates if the page must be written back to disk on eviction.
- Reference/Accessed Bit: Set on read or write, used by replacement algorithms (e.g., LRU approximation).
- Protection/Permission Bits: Read, Write, Execute (NX bit for security).

3. The Memory Management Unit (MMU) & Translation Lookaside Buffer (TLB)
Address translation occurs on every single memory access instruction (fetch, load, store). Since reading a multi-level page table from DRAM incurs a significant performance penalty (2 to 5 extra memory cycles), modern CPUs incorporate a hardware cache called the Translation Lookaside Buffer (TLB).

TLB Lookup Flow:
1. CPU executes an instruction referencing virtual address V.
2. MMU extracts VPN and searches the TLB (a high-speed, fully associative or set-associative hardware cache).
3. TLB Hit: Physical Frame Number (PFN) is returned in 1 clock cycle. Physical address is formed: [ PFN | Offset ].
4. TLB Miss: The MMU (or OS hardware page-table walker) traverses the hierarchical Page Table in DRAM to retrieve the PTE.
5. The retrieved PTE is loaded into the TLB, evicting an older entry if full.
6. If the Present Bit in the PTE is 0, a hardware exception is triggered: Page Fault!

4. Page Fault Handling Mechanism
A Page Fault is a software interrupt (trap) handled by the kernel:
1. CPU traps to the OS kernel page fault handler.
2. OS checks if the virtual address was valid (within process address space via VMA/vm_area_struct). If invalid, signal SIGSEGV (Segmentation Fault).
3. If valid, locate a free physical frame in RAM. If none exists, invoke a Page Replacement Algorithm (e.g., LRU, Clock algorithm) to evict a victim page.
4. If victim page is dirty, write it to swap disk.
5. Issue an asynchronous I/O read to load the requested page from disk into the allocated frame.
6. Once I/O completes, update the PTE (set Valid bit = 1, PFN = allocated frame).
7. Restore process state and restart the faulting CPU instruction.

5. Critical Engineering Definitions
- Working Set Model: The set of pages actively referenced by a process during a sliding time window Δ. If RAM cannot hold the working set of all active processes, Thrashing occurs.
- Thrashing: A severe performance degradation where the CPU spends more time swapping pages in and out of disk than executing instructions (high page fault rate, near-zero CPU utilization).
- Spatial Locality: Tendency of an application to access memory addresses near recently accessed addresses (e.g., array traversal).
- Temporal Locality: Tendency to re-access the exact same memory location repeatedly within a short duration (e.g., loop counter).
`;
